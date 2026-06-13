import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantService } from "../tenant/tenant.service";
import { EventService } from "../event/event.service";
import { mintTicket, transferTicket, prepareTrustlineTx } from "@repo/stellar";
import * as crypto from "crypto";
import { Keypair } from "stellar-sdk";

export interface AttendeeKeys {
  publicKey: string;
  secret: string;
}

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private eventService: EventService
  ) {}

  // Deterministically derive attendee Stellar keys
  getAttendeeKeys(email: string, tenantId: string): AttendeeKeys {
    const seed = crypto
      .createHash("sha256")
      .update(email.toLowerCase() + "-" + tenantId + "-attendee-salt-2026")
      .digest();
    const key = Keypair.fromRawEd25519Seed(seed);
    return {
      publicKey: key.publicKey(),
      secret: key.secret(),
    };
  }

  // Generate secure dynamic HMAC-SHA256 token for QR verification
  generateQrToken(ticketId: string, attendeeId: string, timestamp: number): string {
    const secret = process.env.HMAC_SECRET || "fallback-hmac-secret-key-for-gate-scans";
    const data = `${ticketId}:${attendeeId}:${timestamp}`;
    const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
    return `${data}:${hmac}`;
  }

  async purchaseTicket(data: {
    ticketTypeId: string;
    attendeeName: string;
    attendeeEmail: string;
    paymentMethod: string;
    stellarPublicKey?: string;
    zkCommitment?: string;
  }) {
    // 1. Load ticket type and event details
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: data.ticketTypeId },
      include: { event: true },
    });
    if (!ticketType) throw new NotFoundException(`Ticket class not found`);
    if (ticketType.sold >= ticketType.quantity) {
      throw new BadRequestException(`Ticket type is sold out`);
    }

    const event = ticketType.event;
    const tenantId = event.tenantId;

    // 2. Derive/Set Target Public Key
    const isNonCustodial = !!data.stellarPublicKey;
    const targetPublicKey = data.stellarPublicKey || this.getAttendeeKeys(data.attendeeEmail, tenantId).publicKey;

    // Find or create Attendee
    let attendee = await this.prisma.attendee.findFirst({
      where: {
        email: data.attendeeEmail.toLowerCase(),
        tenantId,
      },
    });

    if (!attendee) {
      attendee = await this.prisma.attendee.create({
        data: {
          tenantId,
          email: data.attendeeEmail.toLowerCase(),
          name: data.attendeeName,
          stellarPublicKey: targetPublicKey,
        },
      });
    } else if (isNonCustodial && attendee.stellarPublicKey !== data.stellarPublicKey) {
      // Update custom wallet key if attendee logs in with a new non-custodial wallet
      attendee = await this.prisma.attendee.update({
        where: { id: attendee.id },
        data: { stellarPublicKey: data.stellarPublicKey },
      });
    }

    // 3. Derive Tenant Keys for issuing and distributing
    const tenantKeys = this.tenantService.getTenantKeys(tenantId);
    const assetCode = this.eventService.deriveAssetCode(ticketType.name, event.id);

    // 4. Mint ticket on Stellar Testnet
    let txHash = "";
    if (isNonCustodial) {
      // Transfer to existing trustline-enabled wallet
      const stellarResult = await transferTicket({
        distributorSecret: tenantKeys.distributor.secret,
        destinationPublicKey: targetPublicKey,
        assetCode,
        issuerPublicKey: tenantKeys.issuer.publicKey,
        amount: "1.0000000",
      });
      txHash = stellarResult.txHash;
    } else {
      // Derive custodial keypair and fund/trustline/mint in one backend transaction
      const attendeeKeys = this.getAttendeeKeys(data.attendeeEmail, tenantId);
      const stellarResult = await mintTicket({
        distributorSecret: tenantKeys.distributor.secret,
        destinationSecret: attendeeKeys.secret,
        destinationPublicKey: attendeeKeys.publicKey,
        assetCode,
        issuerPublicKey: tenantKeys.issuer.publicKey,
        amount: "1.0000000",
      });
      txHash = stellarResult.txHash;
    }

    // 5. Update TicketType sold count
    await this.prisma.ticketType.update({
      where: { id: ticketType.id },
      data: { sold: ticketType.sold + 1 },
    });

    // 6. Create Ticket record
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketTypeId: ticketType.id,
        attendeeId: attendee.id,
        stellarAssetCode: assetCode,
        stellarTxHash: txHash,
        status: "ACTIVE",
        issuedAt: new Date(),
        zkCommitment: data.zkCommitment,
      },
    });

    // 7. Generate active HMAC QR token and save it
    const qrToken = this.generateQrToken(ticket.id, attendee.id, Date.now());
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrToken },
    });

    // 8. Log Payment
    await this.prisma.payment.create({
      data: {
        ticketId: ticket.id,
        amount: ticketType.price,
        currency: ticketType.currency,
        method: data.paymentMethod,
        status: "PAID",
        stellarTxHash: txHash,
      },
    });

    return updatedTicket;
  }

  async getAttendeeTickets(email: string) {
    return this.prisma.ticket.findMany({
      where: {
        attendee: {
          email: email.toLowerCase(),
        },
      },
      include: {
        ticketType: {
          include: {
            event: true,
          },
        },
        attendee: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTicketWithFreshQrToken(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        attendee: true,
        ticketType: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException(`Ticket not found`);

    // Generate fresh time-sensitive HMAC token
    const freshToken = this.generateQrToken(ticket.id, ticket.attendeeId, Date.now());

    // Update in DB and return
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { qrToken: freshToken },
      include: {
        attendee: true,
        ticketType: {
          include: {
            event: true,
          },
        },
      },
    });
  }

  async prepareTrustline(ticketTypeId: string, publicKey: string) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    });
    if (!ticketType) throw new NotFoundException(`Ticket class not found`);

    const event = ticketType.event;
    const tenantId = event.tenantId;

    const tenantKeys = this.tenantService.getTenantKeys(tenantId);
    const assetCode = this.eventService.deriveAssetCode(ticketType.name, event.id);

    const xdr = await prepareTrustlineTx({
      publicKey,
      assetCode,
      issuerPublicKey: tenantKeys.issuer.publicKey,
    });

    return { xdr };
  }

  async getWalletTickets(publicKey: string) {
    return this.prisma.ticket.findMany({
      where: {
        attendee: {
          stellarPublicKey: publicKey,
        },
      },
      include: {
        ticketType: {
          include: {
            event: true,
          },
        },
        attendee: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
