import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TenantModule } from "./tenant/tenant.module";
import { EventModule } from "./event/event.module";
import { TicketModule } from "./ticket/ticket.module";
import { CheckInModule } from "./checkin/checkin.module";

@Module({
  imports: [TenantModule, EventModule, TicketModule, CheckInModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
