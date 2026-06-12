import { Body, Controller, Post } from "@nestjs/common";
import { CheckInService } from "./checkin.service";

@Controller("checkin")
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post()
  async scan(
    @Body() body: { qrToken: string; scannedById: string; deviceId?: string }
  ) {
    return this.checkInService.processCheckIn(body);
  }
}
