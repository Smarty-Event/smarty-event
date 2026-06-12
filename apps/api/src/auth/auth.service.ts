import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TenantService } from "../tenant/tenant.service";
import * as crypto from "crypto";

export interface JwtPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || "smarty-events-super-secret-jwt-key";

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService
  ) {}

  // Helper to hash passwords using native PBKDF2
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
  }

  // Helper to verify passwords
  private verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, hash] = parts;
    const verifyHash = crypto
      .pbkdf2Sync(password, salt || "", 1000, 64, "sha512")
      .toString("hex");
    return hash === verifyHash;
  }

  // Native JWT Signer
  signJwt(payload: JwtPayload): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.jwtSecret)
      .update(`${header}.${body}`)
      .digest("base64url");
    return `${header}.${body}.${signature}`;
  }

  // Native JWT Verifier
  verifyJwt(token: string): JwtPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", this.jwtSecret)
      .update(`${header}.${body}`)
      .digest("base64url");
    
    if (signature !== expectedSig) return null;

    try {
      return JSON.parse(Buffer.from(body || "", "base64url").toString("utf8"));
    } catch {
      return null;
    }
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    tenantName: string;
    tenantSlug: string;
  }) {
    // 1. Check if email is already taken
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingUser) {
      throw new BadRequestException("User email is already registered");
    }

    // 2. Check if tenant slug is already taken
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: data.tenantSlug.toLowerCase() },
    });
    if (existingTenant) {
      throw new BadRequestException("Tenant subdomain slug is already taken");
    }

    // 3. Create Tenant (generates keys)
    const tenant = await this.tenantService.createTenant({
      name: data.tenantName,
      slug: data.tenantSlug.toLowerCase(),
    });

    // 4. Create User under Tenant with role OWNER
    const passwordHash = this.hashPassword(data.password);
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        tenantId: tenant.id,
        role: "OWNER",
      },
    });

    // 5. Create matching Attendee record so they can also get tickets
    const attendeeKeys = this.prisma.attendee.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
        name: data.name,
        stellarPublicKey: tenant.stellarPublicKey, // Reuse tenant public key or dynamic key
      },
    });
    await attendeeKeys;

    // 6. Generate Token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: user.role,
    };

    return {
      access_token: this.signJwt(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant.name,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isValid = this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    return {
      access_token: this.signJwt(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
    };
  }
}
