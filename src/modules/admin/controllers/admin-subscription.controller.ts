import {
  Body,
  Controller,
  Get,
  Param,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRoles } from '../../../common/decorators/user-roles.decorator';
import { PaginatedOptionsDto } from '../../../common/dto/paginated-options.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Role } from '../../../common/enums/role.enum';
import { UserRolesGuard } from '../../../common/guards/user-roles.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { RequestUser } from '../../auth/strategies/bearer-token.strategy';
import { ActivateSubscriptionDto } from '../../subscription/dto/activate-subscription.dto';
import { SubscriptionResponseDto } from '../../subscription/dto/subscription-response.dto';
import { AdminSubscriptionDetailDto } from '../dto/admin-subscription-detail.dto';
import { AdminSubscriptionHistoryItemDto } from '../dto/admin-subscription-history-item.dto';
import { AdminSubscriptionListItemDto } from '../dto/admin-subscription-list-item.dto';
import { ActivateAdminSubscriptionUseCase } from '../use-cases/activate-admin-subscription.use-case';
import { ExpireAdminSubscriptionUseCase } from '../use-cases/expire-admin-subscription.use-case';
import { GetAdminSubscriptionHistoryUseCase } from '../use-cases/get-admin-subscription-history.use-case';
import { GetAdminSubscriptionUseCase } from '../use-cases/get-admin-subscription.use-case';
import { ListAdminSubscriptionsUseCase } from '../use-cases/list-admin-subscriptions.use-case';

@ApiTags('admin-subscriptions')
@Controller('admin/subscriptions')
@UseGuards(BearerAuthGuard, UserRolesGuard)
@UserRoles(Role.SUPER_ADMIN)
@ApiBearerAuth('bearer')
export class AdminSubscriptionController {
  constructor(
    private readonly listAdminSubscriptionsUseCase: ListAdminSubscriptionsUseCase,
    private readonly getAdminSubscriptionUseCase: GetAdminSubscriptionUseCase,
    private readonly getAdminSubscriptionHistoryUseCase: GetAdminSubscriptionHistoryUseCase,
    private readonly activateAdminSubscriptionUseCase: ActivateAdminSubscriptionUseCase,
    private readonly expireAdminSubscriptionUseCase: ExpireAdminSubscriptionUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista assinaturas de todos os tenants (SUPER_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de assinaturas',
  })
  async list(
    @Query() options: PaginatedOptionsDto,
  ): Promise<PaginatedResponseDto<AdminSubscriptionListItemDto>> {
    return this.listAdminSubscriptionsUseCase.run(options);
  }

  @Get(':tenantId/history')
  @ApiOperation({
    summary: 'Histórico administrativo da assinatura do tenant (SUPER_ADMIN)',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de eventos',
    type: [AdminSubscriptionHistoryItemDto],
  })
  async getHistory(
    @Param('tenantId') tenantId: string,
  ): Promise<AdminSubscriptionHistoryItemDto[]> {
    return this.getAdminSubscriptionHistoryUseCase.run(tenantId);
  }

  @Get(':tenantId')
  @ApiOperation({
    summary: 'Detalhe administrativo da assinatura do tenant (SUPER_ADMIN)',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Assinatura encontrada',
    type: AdminSubscriptionDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Assinatura não encontrada' })
  async getOne(
    @Param('tenantId') tenantId: string,
  ): Promise<AdminSubscriptionDetailDto> {
    return this.getAdminSubscriptionUseCase.run(tenantId);
  }

  @Post('activate')
  @ApiOperation({
    summary: 'Ativa ou altera plano manualmente (SUPER_ADMIN)',
  })
  @ApiBody({ type: ActivateSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Assinatura ativada',
    type: SubscriptionResponseDto,
  })
  async activate(
    @Body() dto: ActivateSubscriptionDto,
    @Req() req: { user?: RequestUser },
  ) {
    const activatedBy = req.user?.dbUser?.id ?? '';
    return this.activateAdminSubscriptionUseCase.run(dto, activatedBy);
  }

  @Post('expire-now')
  @ApiOperation({
    summary: 'Força verificação de expiração (SUPER_ADMIN, útil para testes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Expiração processada',
  })
  async expireNow() {
    return this.expireAdminSubscriptionUseCase.run();
  }
}
