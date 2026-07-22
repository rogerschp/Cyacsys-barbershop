import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { CreateGuestBookingDraftDto } from '../dto/create-booking-draft.dto';
import { mapBookingToResponse } from '../mappers/booking.mapper';
import { CreateGuestBookingDraftUseCase } from '../use-cases/create-guest-booking-draft.use-case';

/**
 * Agendamento visitante (sem Bearer).
 * Confirm/cancel guest ficam fora de escopo até ownership (magic link / token).
 */
@ApiTags('guest-booking')
@Controller(
  'tenants/:tenantId/tenant-professionals/:tenantProfessionalId/bookings/guest',
)
@UseGuards(TenantResolverGuard)
export class GuestBookingController {
  constructor(
    private readonly createGuestBookingDraftUseCase: CreateGuestBookingDraftUseCase,
  ) {}

  @Post('draft')
  @ApiOperation({
    summary: 'Cria rascunho como visitante (sem login)',
    description:
      'Requer guestName + guestPhone (email opcional). Sem Bearer. Confirm/cancel guest ainda não disponíveis.',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiBody({ type: CreateGuestBookingDraftDto })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async createDraft(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Body() dto: CreateGuestBookingDraftDto,
  ) {
    const booking = await this.createGuestBookingDraftUseCase.run(
      tenantId,
      tenantProfessionalId,
      dto,
    );
    return mapBookingToResponse(booking);
  }
}
