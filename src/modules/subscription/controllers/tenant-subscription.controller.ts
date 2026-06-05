import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantMembershipGuard } from '../../../common/guards/tenant-membership.guard';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from '../../../common/guards/tenant-roles.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import {
  SubscriptionHistoryResponseDto,
  SubscriptionResponseDto,
} from '../dto/subscription-response.dto';
import { GetSubscriptionHistoryUseCase } from '../use-cases/get-subscription-history.use-case';
import { GetTenantSubscriptionUseCase } from '../use-cases/get-tenant-subscription.use-case';

@ApiTags('subscriptions')
@Controller('tenants/:tenantId/subscription')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
@ApiBearerAuth('bearer')
export class TenantSubscriptionController {
  constructor(
    private readonly getTenantSubscriptionUseCase: GetTenantSubscriptionUseCase,
    private readonly getSubscriptionHistoryUseCase: GetSubscriptionHistoryUseCase,
  ) {}

  @Get()
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
  @ApiOperation({ summary: 'Retorna assinatura atual do tenant com plano' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Assinatura encontrada',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assinatura não encontrada' })
  async getSubscription(@Param('tenantId') tenantId: string) {
    return this.getTenantSubscriptionUseCase.run(tenantId);
  }

  @Get('history')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
  @ApiOperation({ summary: 'Histórico de eventos da assinatura' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de eventos',
    type: [SubscriptionHistoryResponseDto],
  })
  async getHistory(@Param('tenantId') tenantId: string) {
    return this.getSubscriptionHistoryUseCase.run(tenantId);
  }
}
