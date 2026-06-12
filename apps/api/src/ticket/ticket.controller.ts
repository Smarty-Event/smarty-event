import { Body, Controller, Get, Param, Post } from "@nestjs/common";
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
    }
  ) {
    return this.ticketService.purchaseTicket(body);
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
