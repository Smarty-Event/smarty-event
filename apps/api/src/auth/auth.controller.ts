import { Body, Controller, Get, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      tenantName: string;
      tenantSlug: string;
    }
  ) {
    return this.authService.register(body);
  }

  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Get("profile")
  async getProfile(@Headers("authorization") authHeader?: string) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization token");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException("Missing authorization token");
    }

    const payload = this.authService.verifyJwt(token);
    if (!payload) {
      throw new UnauthorizedException("Invalid or expired session token");
    }

    return payload;
  }
}
