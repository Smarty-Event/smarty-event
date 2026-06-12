import { Body, Controller, Get, Param, Post, Query, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { EventService } from "./event.service";
import { FileInterceptor } from "@nestjs/platform-express";
// @ts-ignore
import { diskStorage } from "multer";
import { extname } from "path";
import * as fs from "fs";

// Ensure uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller("events")
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req: any, file: any, callback: any) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    })
  )
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const imageUrl = `http://localhost:3001/uploads/${file.filename}`;
    return { url: imageUrl };
  }

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
