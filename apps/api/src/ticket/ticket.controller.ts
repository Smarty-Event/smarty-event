import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { TicketService } from "./ticket.service";

@Controller("tickets")
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post("buy")
  async buy(
    @Body()
    body: {
      ticketTypeId: string;
      attendeeName: string;
      attendeeEmail: string;
      paymentMethod: string;
      stellarPublicKey?: string;
    }
  ) {
    return this.ticketService.purchaseTicket(body);
  }

  @Get("prepare-trustline")
  async prepareTrustline(
    @Query("ticketTypeId") ticketTypeId: string,
    @Query("publicKey") publicKey: string
  ) {
    return this.ticketService.prepareTrustline(ticketTypeId, publicKey);
  }

  @Get("wallet/:publicKey")
  async getByWallet(@Param("publicKey") publicKey: string) {
    return this.ticketService.getWalletTickets(publicKey);
  }

  @Get("attendee/:email")
  async getByAttendee(@Param("email") email: string) {
    return this.ticketService.getAttendeeTickets(email);
  }

  @Get(":id/qr-token")
  async getFreshQrToken(@Param("id") id: string) {
    return this.ticketService.getTicketWithFreshQrToken(id);
  }
}
