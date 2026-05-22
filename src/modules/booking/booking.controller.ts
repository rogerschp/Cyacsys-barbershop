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
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../tenant-user/entities/tenant-user-role.enum';
import { CreateBookingDraftDto } from './dto/create-booking-draft.dto';
import { CancelBookingDraftUseCase } from './use-cases/cancel-booking-draft.use-case';
import { ConfirmBookingUseCase } from './use-cases/confirm-booking.use-case';
import { CreateBookingDraftUseCase } from './use-cases/create-booking-draft.use-case';
import { TenantResolverGuard } from '../../common/guards/tenant-resolver.guard';

interface RequestWithUserAndMembership {
  user?: {
    dbUser?: {
      id: string;
    };
  };
  tenantMembership?: {
    role: string;
  };
}

const BOOKING_ROLES = [
  TenantUserRole.OWNER,
  TenantUserRole.ADMIN,
  TenantUserRole.STAFF,
  TenantUserRole.BARBER,
] as const;

@ApiTags('booking')
@Controller('tenants/:tenantId/tenant-professionals/:tenantProfessionalId/bookings')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
@ApiBearerAuth('bearer')
export class BookingController {
  constructor(
    private readonly createBookingDraftUseCase: CreateBookingDraftUseCase,
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly cancelBookingDraftUseCase: CancelBookingDraftUseCase,
  ) {}

  @Post('draft')
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({
    summary:
      'Cria rascunho de agendamento (apenas DIRECT_BOOKING; segura o slot até confirmar ou cancelar)',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiBody({ type: CreateBookingDraftDto })
  async createDraft(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Body() dto: CreateBookingDraftDto,
    @Req() req: RequestWithUserAndMembership,
  ) {
    return this.createBookingDraftUseCase.run(
      tenantId,
      tenantProfessionalId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }

  @Patch(':bookingId/confirm')
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({ summary: 'Confirma um rascunho no banco (definitivo)' })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiParam({ name: 'bookingId' })
  async confirm(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Param('bookingId') bookingId: string,
    @Req() req: RequestWithUserAndMembership,
  ) {
    return this.confirmBookingUseCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }

  @Patch(':bookingId/cancel')
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({ summary: 'Cancela um rascunho e libera o horário' })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiParam({ name: 'bookingId' })
  async cancelDraft(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Param('bookingId') bookingId: string,
    @Req() req: RequestWithUserAndMembership,
  ) {
    return this.cancelBookingDraftUseCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
  }
}
