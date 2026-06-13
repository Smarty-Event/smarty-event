import { Test, TestingModule } from "@nestjs/testing";
import { TicketService } from "./ticket.service";
import { PrismaService } from "../prisma.service";
import { TenantService } from "../tenant/tenant.service";
import { EventService } from "../event/event.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";

// Mock the @repo/stellar functions
jest.mock("@repo/stellar", () => ({
  mintTicket: jest.fn(),
  transferTicket: jest.fn(),
  prepareTrustlineTx: jest.fn(),
}));

import { mintTicket, transferTicket } from "@repo/stellar";

describe("TicketService", () => {
  let service: TicketService;
  let prisma: PrismaService;
  let tenantService: TenantService;
  let eventService: EventService;

  const mockPrismaService = {
    ticketType: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    attendee: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
  };

  const mockTenantService = {
    getTenantKeys: jest.fn().mockReturnValue({
      issuer: { publicKey: "ISSUER_PUBLIC_KEY" },
      distributor: { secret: "DISTRIBUTOR_SECRET" },
    }),
  };

  const mockEventService = {
    deriveAssetCode: jest.fn().mockReturnValue("EVT26VIP"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    prisma = module.get<PrismaService>(PrismaService);
    tenantService = module.get<TenantService>(TenantService);
    eventService = module.get<EventService>(EventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAttendeeKeys", () => {
    it("should deterministically generate Ed25519 keys for attendee", () => {
      const email = "test@example.com";
      const tenantId = "tenant-123";
      
      const keys1 = service.getAttendeeKeys(email, tenantId);
      const keys2 = service.getAttendeeKeys(email, tenantId);

      expect(keys1.publicKey).toBe(keys2.publicKey);
      expect(keys1.secret).toBe(keys2.secret);
      expect(keys1.publicKey).toContain("G"); // Stellar public keys start with G
      expect(keys1.secret).toContain("S");    // Stellar seed keys start with S
    });
  });

  describe("generateQrToken", () => {
    it("should generate a valid HMAC token containing data and signature", () => {
      const ticketId = "tkt-123";
      const attendeeId = "att-456";
      const timestamp = Date.now();
      
      const token = service.generateQrToken(ticketId, attendeeId, timestamp);
      const parts = token.split(":");

      expect(parts.length).toBe(4);
      expect(parts[0]).toBe(ticketId);
      expect(parts[1]).toBe(attendeeId);
      expect(parts[2]).toBe(String(timestamp));

      // Recreate signature and compare
      const secret = process.env.HMAC_SECRET || "fallback-hmac-secret-key-for-gate-scans";
      const rawData = `${ticketId}:${attendeeId}:${timestamp}`;
      const expectedHmac = crypto.createHmac("sha256", secret).update(rawData).digest("hex");
      expect(parts[3]).toBe(expectedHmac);
    });
  });

  describe("purchaseTicket", () => {
    const ticketTypeId = "tkt-type-abc";
    const attendeeEmail = "buyer@example.com";
    const attendeeName = "John Doe";

    it("should successfully purchase a ticket using a custodial wallet", async () => {
      const mockTicketType = {
        id: ticketTypeId,
        name: "VIP",
        price: 5000,
        currency: "USDC",
        quantity: 100,
        sold: 10,
        event: { id: "evt-999", tenantId: "tenant-123" },
      };

      const mockAttendee = {
        id: "att-123",
        email: attendeeEmail,
        name: attendeeName,
        stellarPublicKey: "CUSTODIAL_PUBLIC_KEY",
      };

      const mockTicket = {
        id: "ticket-555",
        status: "ACTIVE",
      };

      mockPrismaService.ticketType.findUnique.mockResolvedValue(mockTicketType);
      mockPrismaService.attendee.findFirst.mockResolvedValue(null);
      mockPrismaService.attendee.create.mockResolvedValue(mockAttendee);
      (mintTicket as jest.Mock).mockResolvedValue({ txHash: "stellar_tx_hash_111" });
      mockPrismaService.ticketType.update.mockResolvedValue({});
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue({ ...mockTicket, qrToken: "mock-qr" });
      mockPrismaService.payment.create.mockResolvedValue({});

      const result = await service.purchaseTicket({
        ticketTypeId,
        attendeeName,
        attendeeEmail,
        paymentMethod: "CARD",
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.ticketType.findUnique).toHaveBeenCalledWith({
        where: { id: ticketTypeId },
        include: { event: true },
      });
      expect(mintTicket).toHaveBeenCalled();
      expect(mockPrismaService.ticket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ticketTypeId,
          attendeeId: "att-123",
          stellarAssetCode: "EVT26VIP",
          stellarTxHash: "stellar_tx_hash_111",
          status: "ACTIVE",
        }),
      });
    });

    it("should successfully purchase a ticket using a non-custodial custom wallet", async () => {
      const mockTicketType = {
        id: ticketTypeId,
        name: "VIP",
        price: 5000,
        currency: "USDC",
        quantity: 100,
        sold: 10,
        event: { id: "evt-999", tenantId: "tenant-123" },
      };

      const mockAttendee = {
        id: "att-123",
        email: attendeeEmail,
        name: attendeeName,
        stellarPublicKey: "NON_CUSTODIAL_PUBLIC_KEY",
      };

      const mockTicket = {
        id: "ticket-555",
        status: "ACTIVE",
      };

      mockPrismaService.ticketType.findUnique.mockResolvedValue(mockTicketType);
      mockPrismaService.attendee.findFirst.mockResolvedValue(mockAttendee);
      (transferTicket as jest.Mock).mockResolvedValue({ txHash: "stellar_tx_hash_222" });
      mockPrismaService.ticketType.update.mockResolvedValue({});
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue({ ...mockTicket, qrToken: "mock-qr" });
      mockPrismaService.payment.create.mockResolvedValue({});

      const result = await service.purchaseTicket({
        ticketTypeId,
        attendeeName,
        attendeeEmail,
        paymentMethod: "USDC",
        stellarPublicKey: "NON_CUSTODIAL_PUBLIC_KEY",
      });

      expect(result).toBeDefined();
      expect(transferTicket).toHaveBeenCalledWith(expect.objectContaining({
        destinationPublicKey: "NON_CUSTODIAL_PUBLIC_KEY",
      }));
    });

    it("should support checking ZK Privacy commitments on checkout", async () => {
      const mockTicketType = {
        id: ticketTypeId,
        name: "VIP",
        price: 5000,
        currency: "USDC",
        quantity: 100,
        sold: 10,
        event: { id: "evt-999", tenantId: "tenant-123" },
      };

      const mockAttendee = { id: "att-123", stellarPublicKey: "KEY" };
      const mockTicket = { id: "ticket-555" };

      mockPrismaService.ticketType.findUnique.mockResolvedValue(mockTicketType);
      mockPrismaService.attendee.findFirst.mockResolvedValue(mockAttendee);
      (mintTicket as jest.Mock).mockResolvedValue({ txHash: "tx" });
      mockPrismaService.ticketType.update.mockResolvedValue({});
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);
      mockPrismaService.ticket.update.mockResolvedValue(mockTicket);
      mockPrismaService.payment.create.mockResolvedValue({});

      await service.purchaseTicket({
        ticketTypeId,
        attendeeName,
        attendeeEmail,
        paymentMethod: "CARD",
        zkCommitment: "zk_commitment_hash_123",
      });

      expect(mockPrismaService.ticket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          zkCommitment: "zk_commitment_hash_123",
        }),
      });
    });

    it("should throw NotFoundException if ticket class doesn't exist", async () => {
      mockPrismaService.ticketType.findUnique.mockResolvedValue(null);

      await expect(service.purchaseTicket({
        ticketTypeId: "invalid",
        attendeeName,
        attendeeEmail,
        paymentMethod: "CARD",
      })).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if ticket type is sold out", async () => {
      const mockTicketType = {
        id: ticketTypeId,
        quantity: 10,
        sold: 10,
      };

      mockPrismaService.ticketType.findUnique.mockResolvedValue(mockTicketType);

      await expect(service.purchaseTicket({
        ticketTypeId,
        attendeeName,
        attendeeEmail,
        paymentMethod: "CARD",
      })).rejects.toThrow(BadRequestException);
    });
  });
});
