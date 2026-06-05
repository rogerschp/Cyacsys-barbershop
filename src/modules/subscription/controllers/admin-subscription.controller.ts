import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRoles } from '../../../common/decorators/user-roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { UserRolesGuard } from '../../../common/guards/user-roles.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { RequestUser } from '../../auth/strategies/bearer-token.strategy';
import { ActivateSubscriptionDto } from '../dto/activate-subscription.dto';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
import { ActivateSubscriptionUseCase } from '../use-cases/activate-subscription.use-case';
import { ExpireSubscriptionsUseCase } from '../use-cases/expire-subscriptions.use-case';

@ApiTags('admin-subscriptions')
@Controller('admin/subscriptions')
@UseGuards(BearerAuthGuard, UserRolesGuard)
@UserRoles(Role.SUPER_ADMIN)
@ApiBearerAuth('bearer')
export class AdminSubscriptionController {
  constructor(
    private readonly activateSubscriptionUseCase: ActivateSubscriptionUseCase,
    private readonly expireSubscriptionsUseCase: ExpireSubscriptionsUseCase,
  ) {}

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
    return this.activateSubscriptionUseCase.run(dto, activatedBy);
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
    return this.expireSubscriptionsUseCase.run();
  }
}
