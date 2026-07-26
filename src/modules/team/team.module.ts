import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantInvitationRepository } from '../../repository/team/tenant-invitation.repository';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantProfessionalModule } from '../tenant-professional/tenant-professional.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { UserModule } from '../user/user.module';
import { TeamController } from './controllers/team.controller';
import { TenantInvitationEntity } from './entities/tenant-invitation.entity';
import { TENANT_INVITATION_REPOSITORY } from './interfaces/tenant-invitation-repository.interface';
import { CancelTeamInvitationUseCase } from './use-cases/cancel-team-invitation.use-case';
import { ListTeamInvitationsUseCase } from './use-cases/list-team-invitations.use-case';
import { ListTeamMembersUseCase } from './use-cases/list-team-members.use-case';
import { OnboardTeamMemberUseCase } from './use-cases/onboard-team-member.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantInvitationEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
    forwardRef(() => TenantProfessionalModule),
    forwardRef(() => UserModule),
    NotificationModule,
  ],
  controllers: [TeamController],
  providers: [
    TenantInvitationRepository,
    {
      provide: TENANT_INVITATION_REPOSITORY,
      useClass: TenantInvitationRepository,
    },
    OnboardTeamMemberUseCase,
    ListTeamMembersUseCase,
    ListTeamInvitationsUseCase,
    CancelTeamInvitationUseCase,
  ],
  exports: [OnboardTeamMemberUseCase],
})
export class TeamModule {}
