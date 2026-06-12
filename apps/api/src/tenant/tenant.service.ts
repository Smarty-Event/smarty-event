import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import * as crypto from "crypto";
import { Keypair } from "stellar-sdk";

export interface TenantKeys {
  issuer: {
    publicKey: string;
    secret: string;
  };
  distributor: {
    publicKey: string;
    secret: string;
  };
}

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  // Deterministically derive tenant Stellar keys using tenantId
  getTenantKeys(tenantId: string): TenantKeys {
    const issuerSeed = crypto
      .createHash("sha256")
      .update(tenantId + "-issuer-salt-2026")
      .digest();
    const distSeed = crypto
      .createHash("sha256")
      .update(tenantId + "-distributor-salt-2026")
      .digest();

    const issuerKey = Keypair.fromRawEd25519Seed(issuerSeed);
    const distKey = Keypair.fromRawEd25519Seed(distSeed);

    return {
      issuer: {
        publicKey: issuerKey.publicKey(),
        secret: issuerKey.secret(),
      },
      distributor: {
        publicKey: distKey.publicKey(),
        secret: distKey.secret(),
      },
    };
  }

  async createTenant(data: { name: string; slug: string; customDomain?: string }) {
    // 1. Create tenant record first to obtain a stable UUID
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        customDomain: data.customDomain || null,
      },
    });

    // 2. Derive Stellar keys based on the tenant UUID
    const keys = this.getTenantKeys(tenant.id);

    // 3. Update tenant with the distributor public key as public identifier
    return this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stellarPublicKey: keys.distributor.publicKey,
      },
    });
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException(`Tenant not found`);
    return tenant;
  }

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (!tenant) throw new NotFoundException(`Tenant slug not found`);
    return tenant;
  }

  async getMetrics(tenantId: string) {
    const tenant = await this.getTenant(tenantId);
    
    // Count of events
    const eventsCount = await this.prisma.event.count({
      where: { tenantId },
    });

    // Count of ticket types
    const ticketTypes = await this.prisma.ticketType.findMany({
      where: {
        event: { tenantId },
      },
      select: {
        quantity: true,
        sold: true,
      },
    });

    const totalCapacity = ticketTypes.reduce(
      (acc: number, t: { quantity: number }) => acc + t.quantity,
      0
    );
    const totalSold = ticketTypes.reduce(
      (acc: number, t: { sold: number }) => acc + t.sold,
      0
    );

    // Count of checked-in tickets
    const checkedInCount = await this.prisma.ticket.count({
      where: {
        ticketType: {
          event: { tenantId },
        },
        status: "CHECKED_IN",
      },
    });

    const keys = this.getTenantKeys(tenantId);

    return {
      tenantId,
      name: tenant.name,
      slug: tenant.slug,
      eventsCount,
      totalCapacity,
      totalSold,
      checkedInCount,
      stellarPublicKey: tenant.stellarPublicKey,
      stellarIssuerPublicKey: keys.issuer.publicKey,
    };
  }

  async listTenants() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
