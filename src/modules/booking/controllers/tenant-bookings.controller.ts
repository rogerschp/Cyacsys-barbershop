import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../../common/guards/tenant-membership.guard';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from '../../../common/guards/tenant-roles.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { OpsBookingResponseDto } from '../dto/ops-booking-response.dto';
import { BookingStatus } from '../entities/booking-status.enum';
import { ListTenantBookingsUseCase } from '../use-cases/list-tenant-bookings.use-case';

interface RequestWithTenant {
  tenant?: {
    timezone?: string;
  };
}

@ApiTags('booking')
@Controller('tenants/:tenantId/bookings')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
@ApiBearerAuth('bearer')
export class TenantBookingsController {
  constructor(
    private readonly listTenantBookingsUseCase: ListTenantBookingsUseCase,
  ) {}

  @Get()
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
  @ApiOperation({
    summary: 'Lista agendamentos do tenant (visão da unidade)',
    description:
      'Visão consolidada da agenda do estabelecimento (OWNER/ADMIN/STAFF). ' +
      'Filtre por dia (`date`) OU intervalo (`from`+`to`) no fuso do tenant — nunca misture. ' +
      'Intervalo máximo: 31 dias. Ordenado por início asc.',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Um dia no fuso do tenant (yyyy-MM-dd). Mutuamente exclusivo com from/to.',
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
    @Req() req: RequestWithTenant,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status', new ParseEnumPipe(BookingStatus, { optional: true }))
    status?: BookingStatus,
  ) {
    return this.listTenantBookingsUseCase.run({
      tenantId,
      timezone: req.tenant?.timezone ?? 'America/Sao_Paulo',
      date,
      from,
      to,
      status,
    });
  }
}
