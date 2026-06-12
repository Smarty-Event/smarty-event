import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantModule } from "../tenant/tenant.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [TenantModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
