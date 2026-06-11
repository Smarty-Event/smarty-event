import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: "ok",
      service: "StellarEvents API",
      timestamp: new Date().toISOString(),
    };
  }
}
