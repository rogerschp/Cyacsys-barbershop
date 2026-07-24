import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
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
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../../common/guards/tenant-membership.guard';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from '../../../common/guards/tenant-roles.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { RequestUser } from '../../auth/strategies/bearer-token.strategy';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { OnboardTeamMemberDto } from '../dto/onboard-team-member.dto';
import {
  OnboardTeamMemberResponseDto,
  TeamInvitationResponseDto,
  TeamMemberResponseDto,
} from '../dto/team-response.dto';
import { TenantInvitationStatus } from '../enums/tenant-invitation-status.enum';
import { CancelTeamInvitationUseCase } from '../use-cases/cancel-team-invitation.use-case';
import { ListTeamInvitationsUseCase } from '../use-cases/list-team-invitations.use-case';
import { ListTeamMembersUseCase } from '../use-cases/list-team-members.use-case';
import { OnboardTeamMemberUseCase } from '../use-cases/onboard-team-member.use-case';

@ApiTags('team')
@Controller('tenants/:tenantId/team')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
@ApiBearerAuth('bearer')
export class TeamController {
  constructor(
    private readonly onboardTeamMemberUseCase: OnboardTeamMemberUseCase,
    private readonly listTeamMembersUseCase: ListTeamMembersUseCase,
    private readonly listTeamInvitationsUseCase: ListTeamInvitationsUseCase,
    private readonly cancelTeamInvitationUseCase: CancelTeamInvitationUseCase,
  ) {}

  @Post('onboard')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({
    summary: 'Adiciona membro existente ou cria convite por e-mail',
    description:
      'Se o usuário já existe: cria membership (e TenantProfessional se BARBER com perfil). ' +
      'Se não existe: cria TenantInvitation PENDING e dispara notificação (mock no MVP).',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiBody({ type: OnboardTeamMemberDto })
  @ApiResponse({ status: 201, type: OnboardTeamMemberResponseDto })
  async onboard(
    @Param('tenantId') tenantId: string,
    @Body() dto: OnboardTeamMemberDto,
    @Req() req: { user?: RequestUser },
  ): Promise<OnboardTeamMemberResponseDto> {
    const createdByUserId = req.user?.dbUser?.id;
    if (!createdByUserId) {
      throw new NotFoundException('User not found');
    }
    return this.onboardTeamMemberUseCase.run({
      tenantId,
      email: dto.email,
      role: dto.role,
      createdByUserId,
    });
  }

  @Get()
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({ summary: 'Lista membros do estabelecimento' })
  @ApiParam({ name: 'tenantId' })
  @ApiResponse({ status: 200, type: [TeamMemberResponseDto] })
  async listMembers(
    @Param('tenantId') tenantId: string,
  ): Promise<TeamMemberResponseDto[]> {
    return this.listTeamMembersUseCase.run(tenantId);
  }

  @Get('invitations')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({ summary: 'Lista convites do estabelecimento' })
  @ApiParam({ name: 'tenantId' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TenantInvitationStatus,
  })
  @ApiResponse({ status: 200, type: [TeamInvitationResponseDto] })
  async listInvitations(
    @Param('tenantId') tenantId: string,
    @Query(
      'status',
      new ParseEnumPipe(TenantInvitationStatus, { optional: true }),
    )
    status?: TenantInvitationStatus,
  ): Promise<TeamInvitationResponseDto[]> {
    return this.listTeamInvitationsUseCase.run(tenantId, status);
  }

  @Delete('invitations/:invitationId')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({ summary: 'Cancela convite pendente' })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'invitationId' })
  @ApiResponse({ status: 200, type: TeamInvitationResponseDto })
  async cancelInvitation(
    @Param('tenantId') tenantId: string,
    @Param('invitationId') invitationId: string,
  ): Promise<TeamInvitationResponseDto> {
    return this.cancelTeamInvitationUseCase.run(tenantId, invitationId);
  }
}
