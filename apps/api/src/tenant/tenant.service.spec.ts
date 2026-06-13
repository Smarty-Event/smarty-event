import { Test, TestingModule } from "@nestjs/testing";
import { TenantService } from "./tenant.service";
import { PrismaService } from "../prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("TenantService", () => {
  let service: TenantService;
  let prisma: PrismaService;

  const mockPrismaService = {
    tenant: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    event: {
      count: jest.fn(),
    },
    ticketType: {
      findMany: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getTenantKeys", () => {
    it("should generate deterministic issuer and distributor keys from tenant UUID", () => {
      const tenantId = "tenant-uuid-1234";
      const keys1 = service.getTenantKeys(tenantId);
      const keys2 = service.getTenantKeys(tenantId);

      expect(keys1.issuer.publicKey).toBe(keys2.issuer.publicKey);
      expect(keys1.distributor.publicKey).toBe(keys2.distributor.publicKey);
      expect(keys1.issuer.publicKey).not.toBe(keys1.distributor.publicKey);
      
      // Stellar key formats validation
      expect(keys1.issuer.publicKey.startsWith("G")).toBe(true);
      expect(keys1.issuer.secret.startsWith("S")).toBe(true);
      expect(keys1.distributor.publicKey.startsWith("G")).toBe(true);
      expect(keys1.distributor.secret.startsWith("S")).toBe(true);
    });
  });

  describe("createTenant", () => {
    it("should successfully register a tenant and associate derived distributor keys", async () => {
      const tenantData = { name: "Google", slug: "google", customDomain: "google.com" };
      const createdTenant = { id: "google-id-123", ...tenantData };
      const updatedTenant = { ...createdTenant, stellarPublicKey: "DISTRIBUTOR_PUBLIC_KEY" };

      mockPrismaService.tenant.create.mockResolvedValue(createdTenant);
      mockPrismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.createTenant(tenantData);

      expect(result).toBeDefined();
      expect(mockPrismaService.tenant.create).toHaveBeenCalledWith({
        data: {
          name: "Google",
          slug: "google",
          customDomain: "google.com",
        },
      });
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: "google-id-123" },
        data: {
          stellarPublicKey: expect.any(String), // Derived distributor key
        },
      });
    });
  });

  describe("getTenant & getTenantBySlug", () => {
    it("should fetch tenant by ID", async () => {
      const mockTenant = { id: "t-1", name: "Org" };
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getTenant("t-1");
      expect(result).toBe(mockTenant);
    });

    it("should throw NotFoundException if tenant ID not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      await expect(service.getTenant("invalid")).rejects.toThrow(NotFoundException);
    });

    it("should fetch tenant by slug", async () => {
      const mockTenant = { id: "t-1", slug: "org-slug" };
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getTenantBySlug("org-slug");
      expect(result).toBe(mockTenant);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: "org-slug" },
      });
    });

    it("should throw NotFoundException if slug not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      await expect(service.getTenantBySlug("invalid-slug")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getMetrics", () => {
    it("should compute aggregates for events, capacities, sold tickets and check-ins", async () => {
      const tenantId = "t-1";
      const mockTenant = { id: tenantId, name: "Org", slug: "org", stellarPublicKey: "DIST_KEY" };
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.event.count.mockResolvedValue(3);
      mockPrismaService.ticketType.findMany.mockResolvedValue([
        { quantity: 100, sold: 45 },
        { quantity: 50, sold: 10 },
      ]);
      mockPrismaService.ticket.count.mockResolvedValue(22);

      const metrics = await service.getMetrics(tenantId);

      expect(metrics).toEqual({
        tenantId,
        name: "Org",
        slug: "org",
        eventsCount: 3,
        totalCapacity: 150, // 100 + 50
        totalSold: 55,       // 45 + 10
        checkedInCount: 22,
        stellarPublicKey: "DIST_KEY",
        stellarIssuerPublicKey: expect.any(String),
      });
      expect(mockPrismaService.event.count).toHaveBeenCalledWith({ where: { tenantId } });
      expect(mockPrismaService.ticket.count).toHaveBeenCalledWith({
        where: {
          ticketType: { event: { tenantId } },
          status: "CHECKED_IN",
        },
      });
    });
  });
});
