import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { RequestUser } from '../auth/strategies/bearer-token.strategy';
import { MyTenantResponseDto } from './dto/my-tenant-response.dto';
import { ListMyTenantsUseCase } from './use-cases/list-my-tenants.use-case';

/** Rotas em `/users/me/tenants` — no TenantUserModule para evitar ciclo User ↔ TenantUser. */
@ApiTags('users')
@Controller('users')
export class UserTenantsController {
  constructor(private readonly listMyTenantsUseCase: ListMyTenantsUseCase) {}

  @Get('me/tenants')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Lista estabelecimentos onde o usuário autenticado é membro',
    description:
      'Retorna apenas memberships ACTIVE (OWNER | ADMIN | BARBER | STAFF) com resumo do tenant. Não inclui estabelecimentos onde o usuário só agendou como cliente sem vínculo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Memberships ativas do usuário',
    type: [MyTenantResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  async listMyTenants(@Req() req: { user?: RequestUser }) {
    const userId = req.user?.dbUser?.id;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    return this.listMyTenantsUseCase.run(userId);
  }
}
