import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantModule } from "../tenant/tenant.module";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";

@Module({
  imports: [TenantModule],
  controllers: [EventController],
  providers: [EventService, PrismaService],
  exports: [EventService],
})
export class EventModule {}
