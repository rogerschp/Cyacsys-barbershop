import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { TeamInvitationResponseDto } from '../dto/team-response.dto';
import { TenantInvitationStatus } from '../enums/tenant-invitation-status.enum';
import {
  ITenantInvitationRepository,
  TENANT_INVITATION_REPOSITORY,
} from '../interfaces/tenant-invitation-repository.interface';
import { mapInvitationToResponse } from '../mappers/team.mapper';

@Injectable()
export class CancelTeamInvitationUseCase {
  constructor(
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Inject(TENANT_INVITATION_REPOSITORY)
    private readonly invitationRepository: ITenantInvitationRepository,
  ) {}

  async run(
    tenantId: string,
    invitationId: string,
  ): Promise<TeamInvitationResponseDto> {
    await this.findTenantByIdUseCase.run(tenantId);
    const invitation = await this.invitationRepository.findByIdAndTenant(
      invitationId,
      tenantId,
    );
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== TenantInvitationStatus.PENDING) {
      throw new BusinessRuleException(
        'TEAM_INVITATION_NOT_PENDING',
        'Somente convites pendentes podem ser cancelados.',
        { invitationId, status: invitation.status },
      );
    }
    const updated = await this.invitationRepository.updateStatus(
      invitationId,
      TenantInvitationStatus.CANCELLED,
    );
    return mapInvitationToResponse(updated);
  }
}
