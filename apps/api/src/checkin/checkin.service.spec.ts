import { Test, TestingModule } from "@nestjs/testing";
import { CheckInService } from "./checkin.service";
import { PrismaService } from "../prisma.service";
import { TenantService } from "../tenant/tenant.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";

// Mock the @repo/stellar functions
jest.mock("@repo/stellar", () => ({
  verifyTicketOwnership: jest.fn(),
  verifyZkTicketOnChain: jest.fn(),
}));

import { verifyTicketOwnership, verifyZkTicketOnChain } from "@repo/stellar";

describe("CheckInService", () => {
  let service: CheckInService;
  let prisma: PrismaService;
  let tenantService: TenantService;

  const mockPrismaService = {
    ticket: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    checkIn: {
      create: jest.fn(),
    },
  };

  const mockTenantService = {
    getTenantKeys: jest.fn().mockReturnValue({
      issuer: { publicKey: "ISSUER_PUBLIC_KEY" },
      distributor: { secret: "DISTRIBUTOR_SECRET" },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    service = module.get<CheckInService>(CheckInService);
    prisma = module.get<PrismaService>(PrismaService);
    tenantService = module.get<TenantService>(TenantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("processCheckIn (Normal Path with HMAC)", () => {
    const secret = "smarty-events-super-secret-hmac-key-for-dynamic-qr-tokens";
    
    beforeAll(() => {
      process.env.HMAC_SECRET = secret;
    });

    it("should successfully check in a valid ticket", async () => {
      const ticketId = "ticket-123";
      const attendeeId = "attendee-456";
      const timestamp = Date.now();
      const rawData = `${ticketId}:${attendeeId}:${timestamp}`;
      const signature = crypto.createHmac("sha256", secret).update(rawData).digest("hex");
      const qrToken = `${ticketId}:${attendeeId}:${timestamp}:${signature}`;

      const mockTicket = {
        id: ticketId,
        status: "CREATED",
        stellarAssetCode: "EVT26VIP",
        attendee: { stellarPublicKey: "ATTENDEE_PUBLIC_KEY", name: "Alice" },
        ticketType: { name: "VIP", event: { title: "AI Conference", tenantId: "tenant-99" } },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);
      (verifyTicketOwnership as jest.Mock).mockResolvedValue(true);
      mockPrismaService.checkIn.create.mockResolvedValue({ scannedAt: new Date() });
      mockPrismaService.ticket.update.mockResolvedValue({});

      const result = await service.processCheckIn({
        qrToken,
        scannedById: "staff-777",
      });

      expect(result.message).toContain("Check-in successful");
      expect(result.attendeeName).toBe("Alice");
      expect(mockPrismaService.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: ticketId },
        include: { attendee: true, ticketType: { include: { event: true } } },
      });
      expect(verifyTicketOwnership).toHaveBeenCalledWith({
        publicKey: "ATTENDEE_PUBLIC_KEY",
        assetCode: "EVT26VIP",
        issuerPublicKey: "ISSUER_PUBLIC_KEY",
      });
    });

    it("should fail check-in if signature is invalid", async () => {
      const qrToken = "ticket-123:attendee-456:1234567890:badsignature";
      await expect(service.processCheckIn({ qrToken, scannedById: "staff-777" }))
        .rejects.toThrow(BadRequestException);
    });

    it("should fail check-in if QR is expired", async () => {
      const ticketId = "ticket-123";
      const attendeeId = "attendee-456";
      const timestamp = Date.now() - 600000; // 10 minutes ago
      const rawData = `${ticketId}:${attendeeId}:${timestamp}`;
      const signature = crypto.createHmac("sha256", secret).update(rawData).digest("hex");
      const qrToken = `${ticketId}:${attendeeId}:${timestamp}:${signature}`;

      await expect(service.processCheckIn({ qrToken, scannedById: "staff-777" }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe("processCheckIn (ZK Privacy Path)", () => {
    it("should successfully check in a ZK privacy ticket on-chain", async () => {
      const proof = "proof_data_hex";
      const commitment = "commitment_hex";
      const nullifierHash = "nullifier_hash_hex";
      const qrToken = `zk:${proof}:${commitment}:${nullifierHash}`;

      const mockTicket = {
        id: "ticket-999",
        status: "CREATED",
        attendee: { name: "Alice" },
        ticketType: { name: "General Admission", event: { title: "ZK Summit", tenantId: "tenant-99" } },
      };

      mockPrismaService.ticket.findFirst.mockResolvedValue(mockTicket);
      (verifyZkTicketOnChain as jest.Mock).mockResolvedValue({ success: true, txHash: "tx_hash_123" });
      mockPrismaService.checkIn.create.mockResolvedValue({ scannedAt: new Date() });
      mockPrismaService.ticket.update.mockResolvedValue({});

      const result = await service.processCheckIn({
        qrToken,
        scannedById: "staff-777",
      });

      expect(result.message).toContain("ZK Check-in successful");
      expect(result.attendeeName).toBe("Anonymous (ZK Verified)");
      expect(result.txHash).toBe("tx_hash_123");
      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith({
        where: { zkCommitment: commitment },
        include: { attendee: true, ticketType: { include: { event: true } } },
      });
      expect(verifyZkTicketOnChain).toHaveBeenCalledWith({
        contractId: expect.any(String),
        proof,
        commitment,
        nullifierHash,
        distributorSecret: "DISTRIBUTOR_SECRET",
      });
    });

    it("should block double check-in ZK tickets", async () => {
      const qrToken = "zk:proof:commitment:nullifier";
      const mockTicket = {
        id: "ticket-999",
        status: "CHECKED_IN",
        ticketType: { event: { tenantId: "tenant-99" } },
      };

      mockPrismaService.ticket.findFirst.mockResolvedValue(mockTicket);

      await expect(service.processCheckIn({ qrToken, scannedById: "staff-777" }))
        .rejects.toThrow(BadRequestException);
    });
  });
});
