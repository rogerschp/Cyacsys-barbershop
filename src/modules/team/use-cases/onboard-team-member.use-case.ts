import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { NotificationEvent } from '../../notification/domain/notification-event.enum';
import { DispatchNotificationUseCase } from '../../notification/use-cases/dispatch-notification.use-case';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { LinkProfessionalToTenantUseCase } from '../../tenant-professional/use-cases/link-professional-to-tenant.use-case';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../../tenant-user/interfaces/tenant-user-repository.interface';
import { AddUserToTenantUseCase } from '../../tenant-user/use-cases/add-user-to-tenant.use-case';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../user/interfaces/user-repository.interface';
import { OnboardTeamMemberResponseDto } from '../dto/team-response.dto';
import { TenantInvitationStatus } from '../enums/tenant-invitation-status.enum';
import {
  ITenantInvitationRepository,
  TENANT_INVITATION_REPOSITORY,
} from '../interfaces/tenant-invitation-repository.interface';
import {
  mapInvitationToResponse,
  mapMembershipToTeamMember,
} from '../mappers/team.mapper';

const INVITATION_TTL_DAYS = 7;

@Injectable()
export class OnboardTeamMemberUseCase {
  constructor(
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TENANT_USER_REPOSITORY)
    private readonly tenantUserRepository: ITenantUserRepository,
    @Inject(TENANT_INVITATION_REPOSITORY)
    private readonly invitationRepository: ITenantInvitationRepository,
    private readonly addUserToTenantUseCase: AddUserToTenantUseCase,
    private readonly linkProfessionalToTenantUseCase: LinkProfessionalToTenantUseCase,
    private readonly dispatchNotificationUseCase: DispatchNotificationUseCase,
  ) {}

  async run(params: {
    tenantId: string;
    email: string;
    role: TenantUserRole;
    createdByUserId: string;
  }): Promise<OnboardTeamMemberResponseDto> {
    const email = params.email.trim().toLowerCase();
    const tenant = await this.findTenantByIdUseCase.run(params.tenantId);

    const pending = await this.invitationRepository.findPendingByTenantAndEmail(
      params.tenantId,
      email,
    );
    if (pending) {
      throw new BusinessRuleException(
        'TEAM_INVITATION_ALREADY_PENDING',
        'Já existe um convite pendente para este e-mail neste estabelecimento.',
        { email, tenantId: params.tenantId },
      );
    }

    const user = await this.userRepository.findByEmail(email);

    if (user) {
      const existing = await this.tenantUserRepository.findByTenantAndUser(
        params.tenantId,
        user.id,
      );
      if (existing) {
        throw new BusinessRuleException(
          'TEAM_MEMBER_ALREADY_EXISTS',
          'Este usuário já é membro deste estabelecimento.',
          { email, tenantId: params.tenantId, userId: user.id },
        );
      }

      const membership = await this.addUserToTenantUseCase.run(
        user.id,
        params.tenantId,
        params.role,
      );
      membership.user = user;

      let tenantProfessionalId: string | undefined;
      const profile = user.professionalProfile;
      if (
        params.role === TenantUserRole.BARBER &&
        profile?.id &&
        profile.isActive
      ) {
        const link = await this.linkProfessionalToTenantUseCase.run(
          params.tenantId,
          { professionalProfileId: profile.id, role: TenantUserRole.BARBER },
          params.createdByUserId,
        );
        tenantProfessionalId = link.id;
      }

      return {
        kind: 'MEMBER_ADDED',
        member: mapMembershipToTeamMember(membership),
        tenantProfessionalId,
      };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + INVITATION_TTL_DAYS);

    const invitation = await this.invitationRepository.create({
      tenantId: params.tenantId,
      email,
      role: params.role,
      token,
      expiresAt,
      createdByUserId: params.createdByUserId,
      status: TenantInvitationStatus.PENDING,
    });

    await this.dispatchNotificationUseCase.run({
      event: NotificationEvent.TEAM_INVITATION,
      to: email,
      payload: {
        tenantId: params.tenantId,
        tenantName: tenant.name,
        role: params.role,
        token,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return {
      kind: 'INVITATION_CREATED',
      invitation: mapInvitationToResponse(invitation),
    };
  }
}
