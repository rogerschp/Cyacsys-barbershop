import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../tenant-user/entities/tenant-user-role.enum';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateOpsBookingDraftDto } from './dto/create-booking-draft.dto';
import { OpsBookingResponseDto } from './dto/ops-booking-response.dto';
import { BookingStatus } from './entities/booking-status.enum';
import { mapBookingToResponse } from './mappers/booking.mapper';
import { CancelBookingDraftUseCase } from './use-cases/cancel-booking-draft.use-case';
import { ConfirmBookingUseCase } from './use-cases/confirm-booking.use-case';
import { CreateBookingDraftUseCase } from './use-cases/create-booking-draft.use-case';
import { ListTenantProfessionalBookingsUseCase } from './use-cases/list-tenant-professional-bookings.use-case';
import { CompleteBookingUseCase } from './use-cases/complete-booking.use-case';
import { TenantResolverGuard } from '../../common/guards/tenant-resolver.guard';

interface RequestWithUserAndMembership {
  user?: {
    dbUser?: {
      id: string;
    };
  };
  tenant?: {
    timezone?: string;
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
@Controller(
  'tenants/:tenantId/tenant-professionals/:tenantProfessionalId/bookings',
)
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
    private readonly completeBookingUseCase: CompleteBookingUseCase,
    private readonly listTenantProfessionalBookingsUseCase: ListTenantProfessionalBookingsUseCase,
  ) {}

  @Get()
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({
    summary: 'Lista agendamentos do profissional (agenda ops)',
    description:
      'OWNER/ADMIN/STAFF veem qualquer profissional; BARBER só a própria agenda. ' +
      'Filtre por dia (`date`) OU intervalo (`from`+`to`) no fuso do tenant — nunca misture. ' +
      'Intervalo máximo: 31 dias. Ordenado por início asc.',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Um dia no fuso do tenant (yyyy-MM-dd). Mutuamente exclusivo com from/to.',
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
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filtrar por status (DRAFT, CONFIRMED, CANCELLED, COMPLETED)',
  })
  @ApiResponse({ status: 200, type: [OpsBookingResponseDto] })
  async list(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Req() req: RequestWithUserAndMembership,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status', new ParseEnumPipe(BookingStatus, { optional: true }))
    status?: BookingStatus,
  ) {
    return this.listTenantProfessionalBookingsUseCase.run({
      tenantId,
      tenantProfessionalId,
      timezone: req.tenant?.timezone ?? 'America/Sao_Paulo',
      userId: req.user?.dbUser?.id ?? '',
      callerRole: req.tenantMembership?.role,
      date,
      from,
      to,
      status,
    });
  }

  @Post('draft')
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({
    summary:
      'Cria rascunho de agendamento (apenas DIRECT_BOOKING; segura o slot até confirmar ou cancelar)',
    description:
      'Identidade XOR: clientUserId, ou guestName+guestPhone, ou nenhum (fallback = usuário autenticado).',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiBody({ type: CreateOpsBookingDraftDto })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async createDraft(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Body() dto: CreateOpsBookingDraftDto,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const booking = await this.createBookingDraftUseCase.run(
      tenantId,
      tenantProfessionalId,
      dto,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
    return mapBookingToResponse(booking);
  }

  @Patch(':bookingId/confirm')
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({ summary: 'Confirma um rascunho no banco (definitivo)' })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiParam({ name: 'bookingId' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async confirm(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Param('bookingId') bookingId: string,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const booking = await this.confirmBookingUseCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
    return mapBookingToResponse(booking);
  }

  @Patch(':bookingId/cancel')
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({
    summary: 'Cancela rascunho ou confirmado e libera o horário (ops)',
    description:
      'OWNER/ADMIN/STAFF/BARBER (com escopo de agenda). Sem trava de antecedência do cliente.',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiParam({ name: 'bookingId' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async cancelDraft(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Param('bookingId') bookingId: string,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const booking = await this.cancelBookingDraftUseCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
    return mapBookingToResponse(booking);
  }

  @Patch(':bookingId/complete')
  @TenantRoles(...BOOKING_ROLES)
  @ApiOperation({
    summary: 'Marca agendamento confirmado como concluído (COMPLETED)',
    description:
      'CONFIRMED → COMPLETED. Necessário para o cliente poder avaliar. Também há job automático após endsAt.',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiParam({ name: 'bookingId' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async complete(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Param('bookingId') bookingId: string,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const booking = await this.completeBookingUseCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      req.user?.dbUser?.id ?? '',
      req.tenantMembership?.role,
    );
    return mapBookingToResponse(booking);
  }
}
