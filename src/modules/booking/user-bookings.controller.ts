import {
  Controller,
  Get,
  NotFoundException,
  ParseEnumPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { RequestUser } from '../auth/strategies/bearer-token.strategy';
import { BookingStatus } from './entities/booking-status.enum';
import { MyBookingResponseDto } from './dto/my-booking-response.dto';
import { ListMyBookingsUseCase } from './use-cases/list-my-bookings.use-case';

/** Rotas em `/users/me/bookings` — no BookingModule para evitar ciclo User ↔ Booking. */
@ApiTags('users')
@Controller('users')
export class UserBookingsController {
  constructor(private readonly listMyBookingsUseCase: ListMyBookingsUseCase) {}

  @Get('me/bookings')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Lista agendamentos do usuário autenticado',
    description:
      'Retorna estabelecimento, profissional, serviço e horário no fuso do tenant. ' +
      'Filtre por dia (`date`) OU intervalo (`from`+`to`) — nunca misture. ' +
      'Máximo 31 dias. Dias interpretados no `timezone` (default America/Sao_Paulo).',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Um dia (yyyy-MM-dd). Mutuamente exclusivo com from/to.',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Início do intervalo (yyyy-MM-dd). Exige to.',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Fim do intervalo inclusivo (yyyy-MM-dd). Exige from.',
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    description:
      'IANA TZ para date/from/to (default America/Sao_Paulo). Útil quando há bookings em tenants com fusos diferentes.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filtrar por status (DRAFT, CONFIRMED, CANCELLED, COMPLETED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamentos do usuário',
    type: [MyBookingResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  async listMyBookings(
    @Req() req: { user?: RequestUser },
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('timezone') timezone?: string,
    @Query('status', new ParseEnumPipe(BookingStatus, { optional: true }))
    status?: BookingStatus,
  ) {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.listMyBookingsUseCase.run({
      userId,
      status,
      date,
      from,
      to,
      timezone,
    });
  }
}
