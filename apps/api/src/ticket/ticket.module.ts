import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantModule } from "../tenant/tenant.module";
import { EventModule } from "../event/event.module";
import { TicketController } from "./ticket.controller";
import { TicketService } from "./ticket.service";

@Module({
  imports: [TenantModule, EventModule],
  controllers: [TicketController],
  providers: [TicketService, PrismaService],
  exports: [TicketService],
})
export class TicketModule {}
