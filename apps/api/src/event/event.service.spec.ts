import { Test, TestingModule } from "@nestjs/testing";
import { EventService } from "./event.service";
import { PrismaService } from "../prisma.service";
import { TenantService } from "../tenant/tenant.service";
import { NotFoundException } from "@nestjs/common";

// Mock the @repo/stellar functions
jest.mock("@repo/stellar", () => ({
  createTicketAsset: jest.fn(),
}));

import { createTicketAsset } from "@repo/stellar";

describe("EventService", () => {
  let service: EventService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    speaker: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
    ticketType: {
      create: jest.fn(),
    },
  };

  const mockTenantService = {
    getTenant: jest.fn(),
    getTenantKeys: jest.fn().mockReturnValue({
      issuer: { secret: "ISSUER_SECRET", publicKey: "ISSUER_PUBLIC_KEY" },
      distributor: { secret: "DISTRIBUTOR_SECRET", publicKey: "DISTRIBUTOR_PUBLIC_KEY" },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("deriveAssetCode", () => {
    it("should derive a valid 12-character uppercase Stellar asset code from ticket name and event ID", () => {
      const code = service.deriveAssetCode("VIP Pass!", "evt-1234-5678");
      expect(code).toBe("VIPPEVT12345");
      expect(code.length).toBeLessThanOrEqual(12);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it("should pad or format correctly if ticket name has special characters", () => {
      const code = service.deriveAssetCode("Early Bird @ $50", "abc-def");
      expect(code).toBe("EARLABCDEF");
    });
  });

  describe("createEvent", () => {
    it("should create a new event for a valid tenant", async () => {
      const tenantId = "tenant-123";
      const eventData = {
        title: "Summit",
        startDate: "2026-10-10T09:00:00Z",
        endDate: "2026-10-12T17:00:00Z",
        capacity: 500,
      };

      mockTenantService.getTenant.mockResolvedValue({});
      mockPrismaService.event.create.mockResolvedValue({ id: "evt-123", ...eventData });

      const result = await service.createEvent(tenantId, eventData);

      expect(result).toBeDefined();
      expect(mockTenantService.getTenant).toHaveBeenCalledWith(tenantId);
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          title: "Summit",
          description: null,
          startDate: new Date(eventData.startDate),
          endDate: new Date(eventData.endDate),
          capacity: 500,
          banner: null,
          category: "General",
          timezone: "UTC",
          venue: undefined,
        },
      });
    });
  });

  describe("getEvent", () => {
    it("should return an event if found", async () => {
      const mockEvent = { id: "evt-123", title: "Summit" };
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.getEvent("evt-123");
      expect(result).toBe(mockEvent);
    });

    it("should throw NotFoundException if event is not found", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getEvent("invalid")).rejects.toThrow(NotFoundException);
    });
  });

  describe("addSpeaker", () => {
    it("should successfully add a speaker to an event", async () => {
      const eventId = "evt-123";
      const speakerData = { name: "Bob", bio: "Bio info" };

      mockPrismaService.event.findUnique.mockResolvedValue({ id: eventId });
      mockPrismaService.speaker.create.mockResolvedValue({ id: "spk-1", ...speakerData });

      const result = await service.addSpeaker(eventId, speakerData);

      expect(result).toBeDefined();
      expect(mockPrismaService.speaker.create).toHaveBeenCalledWith({
        data: {
          eventId,
          name: "Bob",
          bio: "Bio info",
          avatar: null,
          social: undefined,
        },
      });
    });
  });

  describe("addTicketType", () => {
    it("should create on-chain Stellar asset and register ticket type", async () => {
      const eventId = "evt-123";
      const ticketTypeData = {
        name: "General Admission",
        price: 3000,
        currency: "USDC",
        quantity: 200,
      };

      const mockEvent = { id: eventId, tenantId: "tenant-9" };
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticketType.create.mockResolvedValue({ id: "tkt-1", ...ticketTypeData });

      const result = await service.addTicketType(eventId, ticketTypeData);

      expect(result).toBeDefined();
      expect(createTicketAsset).toHaveBeenCalledWith({
        issuerSecret: "ISSUER_SECRET",
        distributorSecret: "DISTRIBUTOR_SECRET",
        assetCode: "GENEEVT123",
        limit: "200",
      });
      expect(mockPrismaService.ticketType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId,
          name: "General Admission",
          price: 3000,
          quantity: 200,
        }),
      });
    });
  });
});
