import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TenantModule } from "./tenant/tenant.module";
import { EventModule } from "./event/event.module";
import { TicketModule } from "./ticket/ticket.module";
import { CheckInModule } from "./checkin/checkin.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [TenantModule, EventModule, TicketModule, CheckInModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
