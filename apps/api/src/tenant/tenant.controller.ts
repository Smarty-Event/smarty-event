import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TenantService } from "./tenant.service";

@Controller("tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async create(
    @Body() body: { name: string; slug: string; customDomain?: string }
  ) {
    return this.tenantService.createTenant(body);
  }

  @Get()
  async list() {
    return this.tenantService.listTenants();
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.tenantService.getTenant(id);
  }

  @Get("slug/:slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.tenantService.getTenantBySlug(slug);
  }

  @Get(":id/metrics")
  async getMetrics(@Param("id") id: string) {
    return this.tenantService.getMetrics(id);
  }
}
