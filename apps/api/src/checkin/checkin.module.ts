import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantModule } from "../tenant/tenant.module";
import { CheckInController } from "./checkin.controller";
import { CheckInService } from "./checkin.service";

@Module({
  imports: [TenantModule],
  controllers: [CheckInController],
  providers: [CheckInService, PrismaService],
  exports: [CheckInService],
})
export class CheckInModule {}
