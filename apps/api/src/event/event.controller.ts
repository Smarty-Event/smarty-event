import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { EventService } from "./event.service";

@Controller("events")
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async create(
    @Query("tenantId") tenantId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      startDate: string;
      endDate: string;
      capacity: number;
      banner?: string;
      category?: string;
      timezone?: string;
      venue?: any;
    }
  ) {
    return this.eventService.createEvent(tenantId, body);
  }

  @Get()
  async list(@Query("tenantId") tenantId?: string) {
    return this.eventService.listEvents(tenantId);
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.eventService.getEvent(id);
  }

  @Post(":id/speakers")
  async addSpeaker(
    @Param("id") id: string,
    @Body() body: { name: string; bio?: string; avatar?: string; social?: any }
  ) {
    return this.eventService.addSpeaker(id, body);
  }

  @Post(":id/sessions")
  async addSession(
    @Param("id") id: string,
    @Body()
    body: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      speakerId?: string;
      roomId?: string;
      trackId?: string;
    }
  ) {
    return this.eventService.addSession(id, body);
  }

  @Post(":id/ticket-types")
  async addTicketType(
    @Param("id") id: string,
    @Body()
    body: {
      name: string;
      price: number;
      currency: string;
      quantity: number;
      benefits?: string[];
      earlyBirdPrice?: number;
      earlyBirdUntil?: string;
    }
  ) {
    return this.eventService.addTicketType(id, body);
  }
}
