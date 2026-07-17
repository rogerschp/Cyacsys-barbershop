import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { CreateBookingDraftDto } from '../dto/create-booking-draft.dto';
import { mapBookingToResponse } from '../mappers/booking.mapper';
import { CancelClientBookingUseCase } from '../use-cases/cancel-client-booking.use-case';
import { ConfirmClientBookingUseCase } from '../use-cases/confirm-client-booking.use-case';
import { CreateClientBookingDraftUseCase } from '../use-cases/create-client-booking-draft.use-case';

interface RequestWithUser {
  user?: {
    dbUser?: {
      id: string;
    };
  };
}

@ApiTags('client-booking')
@Controller(
  'tenants/:tenantId/tenant-professionals/:tenantProfessionalId/bookings/public',
)
@UseGuards(BearerAuthGuard, TenantResolverGuard)
@ApiBearerAuth('bearer')
export class ClientBookingController {
  constructor(
    private readonly createClientBookingDraftUseCase: CreateClientBookingDraftUseCase,
    private readonly confirmClientBookingUseCase: ConfirmClientBookingUseCase,
    private readonly cancelClientBookingUseCase: CancelClientBookingUseCase,
  ) {}

  @Post('draft')
  @ApiOperation({
    summary: 'Cria rascunho de agendamento como cliente (sem membership)',
    description:
      'Requer login. clientUserId = usuário autenticado. createdByTenantUserId = null. Sem auto-confirm.',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiBody({ type: CreateBookingDraftDto })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async createDraft(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Body() dto: CreateBookingDraftDto,
    @Req() req: RequestWithUser,
  ) {
    const booking = await this.createClientBookingDraftUseCase.run(
      tenantId,
      tenantProfessionalId,
      dto,
      req.user?.dbUser?.id ?? '',
    );
    return mapBookingToResponse(booking);
  }

  @Patch(':bookingId/confirm')
  @ApiOperation({
    summary: 'Confirma o próprio rascunho (cliente)',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiParam({ name: 'bookingId' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async confirm(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Param('bookingId') bookingId: string,
    @Req() req: RequestWithUser,
  ) {
    const booking = await this.confirmClientBookingUseCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      req.user?.dbUser?.id ?? '',
    );
    return mapBookingToResponse(booking);
  }

  @Patch(':bookingId/cancel')
  @ApiOperation({
    summary: 'Cancela o próprio rascunho (cliente)',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiParam({ name: 'bookingId' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async cancel(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Param('bookingId') bookingId: string,
    @Req() req: RequestWithUser,
  ) {
    const booking = await this.cancelClientBookingUseCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      req.user?.dbUser?.id ?? '',
    );
    return mapBookingToResponse(booking);
  }
}
