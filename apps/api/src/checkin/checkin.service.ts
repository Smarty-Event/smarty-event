import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantService } from "../tenant/tenant.service";
import { verifyTicketOwnership, verifyZkTicketOnChain } from "@repo/stellar";
import * as crypto from "crypto";

@Injectable()
export class CheckInService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService
  ) {}

  async processCheckIn(data: {
    qrToken: string;
    scannedById: string;
    deviceId?: string;
  }) {
    // Decode token
    const parts = data.qrToken.split(":");

    // Handle zero-knowledge privacy check-ins
    if (parts[0] === "zk") {
      if (parts.length !== 4) {
        throw new BadRequestException("Invalid ZK QR token format");
      }

      const [, proof, commitment, nullifierHash] = parts;
      if (!proof || !commitment || !nullifierHash) {
        throw new BadRequestException("Invalid ZK QR token format");
      }

      // 1. Fetch ticket by commitment
      const ticket = await this.prisma.ticket.findFirst({
        where: { zkCommitment: commitment },
        include: {
          attendee: true,
          ticketType: {
            include: { event: true },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException("No active ticket found matching this ZK commitment");
      }

      // 2. Double-spend protection
      if (ticket.status === "CHECKED_IN") {
        throw new BadRequestException("Double-Spend warning: Ticket has already checked-in");
      }

      const event = ticket.ticketType.event;
      const tenantId = event.tenantId;

      // 3. Verify on Stellar Blockchain
      const tenantKeys = this.tenantService.getTenantKeys(tenantId);
      const contractId = process.env.ZK_VERIFIER_CONTRACT_ID || "CBATWOA2NBYJUKYF2UULNUWU52XQZBNGDIMK64GIHIEVABI6WYQ45K62";

      const verificationResult = await verifyZkTicketOnChain({
        contractId,
        proof,
        commitment,
        nullifierHash,
        distributorSecret: tenantKeys.distributor.secret,
      });

      if (!verificationResult.success) {
        throw new BadRequestException(`ZK verification failed: ${verificationResult.error}`);
      }

      // 4. Perform local check-in record creation
      const checkIn = await this.prisma.checkIn.create({
        data: {
          ticketId: ticket.id,
          scannedById: data.scannedById,
          deviceId: data.deviceId || "GATE_SCANNER_ZK",
        },
      });

      // 5. Update Ticket status and record nullifier hash
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "CHECKED_IN",
          zkNullifierHash: nullifierHash,
        },
      });

      return {
        message: "ZK Check-in successful! Access granted (Privacy Protected).",
        attendeeName: "Anonymous (ZK Verified)",
        ticketType: ticket.ticketType.name,
        eventTitle: event.title,
        scannedAt: checkIn.scannedAt,
        txHash: verificationResult.txHash,
      };
    }

    if (parts.length !== 4) {
      throw new BadRequestException("Invalid QR token format");
    }

    const [ticketId, attendeeId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr || "", 10);

    // 2. Validate HMAC signature
    const secret = process.env.HMAC_SECRET || "fallback-hmac-secret-key-for-gate-scans";
    const rawData = `${ticketId}:${attendeeId}:${timestampStr}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawData)
      .digest("hex");

    if (signature !== expectedSignature) {
      throw new BadRequestException("Cryptographic verification failed (Invalid signature)");
    }

    // 3. Check for replay/expiration (QR code valid for 5 minutes)
    const timeDelta = Date.now() - timestamp;
    if (timeDelta > 300000 || timeDelta < -60000) {
      // Allow 1 minute clock desync in the past/future
      throw new BadRequestException("QR Code has expired, please refresh ticket QR");
    }

    // 4. Load Ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        attendee: true,
        ticketType: {
          include: { event: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found in local database");
    }

    // 5. Double-spend protection
    if (ticket.status === "CHECKED_IN") {
      throw new BadRequestException("Double-Spend warning: Ticket has already checked-in");
    }

    const attendee = ticket.attendee;
    const event = ticket.ticketType.event;
    const tenantId = event.tenantId;

    if (!attendee.stellarPublicKey) {
      throw new BadRequestException("Attendee does not have an active Stellar public key");
    }

    // 6. Verify blockchain ownership on Stellar Horizon
    const tenantKeys = this.tenantService.getTenantKeys(tenantId);
    const hasTicketAsset = await verifyTicketOwnership({
      publicKey: attendee.stellarPublicKey,
      assetCode: ticket.stellarAssetCode || "",
      issuerPublicKey: tenantKeys.issuer.publicKey,
    });

    if (!hasTicketAsset) {
      throw new BadRequestException(
        "Gate admission rejected: Ticket asset not owned by the account on the Stellar network"
      );
    }

    // 7. Perform local check-in record creation
    const checkIn = await this.prisma.checkIn.create({
      data: {
        ticketId: ticket.id,
        scannedById: data.scannedById,
        deviceId: data.deviceId || "GATE_SCANNER",
      },
    });

    // 8. Update Ticket status
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "CHECKED_IN" },
    });

    return {
      message: "Check-in successful! Access granted.",
      attendeeName: attendee.name,
      ticketType: ticket.ticketType.name,
      eventTitle: event.title,
      scannedAt: checkIn.scannedAt,
    };
  }
}
