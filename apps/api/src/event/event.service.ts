import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantService } from "../tenant/tenant.service";
import { createTicketAsset } from "@repo/stellar";

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService
  ) {}

  // Helper to generate a unique 12-char Stellar asset code
  deriveAssetCode(ticketName: string, eventId: string): string {
    const cleanName = ticketName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4);
    const cleanId = eventId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8);
    return (cleanName + cleanId).toUpperCase();
  }

  async createEvent(
    tenantId: string,
    data: {
      title: string;
      description?: string;
      startDate: string;
      endDate: string;
      capacity: number;
      banner?: string;
      category?: string;
      timezone?: string;
      venue?: Record<string, unknown>;
    }
  ) {
    await this.tenantService.getTenant(tenantId);

    return this.prisma.event.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity,
        banner: data.banner || null,
        category: data.category || "General",
        timezone: data.timezone || "UTC",
        venue: data.venue || undefined,
      },
    });
  }

  async listEvents(tenantId?: string) {
    return this.prisma.event.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        speakers: true,
        sessions: true,
        ticketTypes: true,
      },
      orderBy: { startDate: "asc" },
    });
  }

  async getEvent(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        speakers: true,
        sessions: true,
        ticketTypes: true,
      },
    });
    if (!event) throw new NotFoundException(`Event not found`);
    return event;
  }

  async addSpeaker(
    eventId: string,
    data: { name: string; bio?: string; avatar?: string; social?: Record<string, unknown> }
  ) {
    await this.getEvent(eventId);

    return this.prisma.speaker.create({
      data: {
        eventId,
        name: data.name,
        bio: data.bio || null,
        avatar: data.avatar || null,
        social: data.social || undefined,
      },
    });
  }

  async addSession(
    eventId: string,
    data: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      speakerId?: string;
      roomId?: string;
      trackId?: string;
    }
  ) {
    await this.getEvent(eventId);

    return this.prisma.session.create({
      data: {
        eventId,
        title: data.title,
        description: data.description || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        speakerId: data.speakerId || null,
        roomId: data.roomId || null,
        trackId: data.trackId || null,
      },
    });
  }

  async addTicketType(
    eventId: string,
    data: {
      name: string;
      price: number;
      currency: string;
      quantity: number;
      benefits?: string[];
      earlyBirdPrice?: number;
      earlyBirdUntil?: string;
    }
  ) {
    const event = await this.getEvent(eventId);
    const keys = this.tenantService.getTenantKeys(event.tenantId);
    
    // Derive asset code for the ticket class (e.g. VIP + Event ID segment)
    const assetCode = this.deriveAssetCode(data.name, eventId);

    // Call Stellar SDK wrapper to register asset on Stellar Testnet and mint supply
    await createTicketAsset({
      issuerSecret: keys.issuer.secret,
      distributorSecret: keys.distributor.secret,
      assetCode,
      limit: data.quantity.toString(),
    });

    return this.prisma.ticketType.create({
      data: {
        eventId,
        name: data.name,
        price: data.price,
        currency: data.currency,
        quantity: data.quantity,
        benefits: data.benefits || undefined,
        earlyBirdPrice: data.earlyBirdPrice || null,
        earlyBirdUntil: data.earlyBirdUntil ? new Date(data.earlyBirdUntil) : null,
      },
    });
  }

  async updateEvent(
    id: string,
    data: {
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      capacity?: number;
      banner?: string;
      category?: string;
      timezone?: string;
      venue?: Record<string, unknown>;
    }
  ) {
    await this.getEvent(id);

    return this.prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        capacity: data.capacity,
        banner: data.banner,
        category: data.category,
        timezone: data.timezone,
        venue: data.venue || undefined,
      },
    });
  }

  async deleteEvent(id: string) {
    await this.getEvent(id);
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
