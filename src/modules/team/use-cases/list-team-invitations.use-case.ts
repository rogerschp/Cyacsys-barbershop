import { Inject, Injectable } from '@nestjs/common';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { TeamInvitationResponseDto } from '../dto/team-response.dto';
import { TenantInvitationStatus } from '../enums/tenant-invitation-status.enum';
import {
  ITenantInvitationRepository,
  TENANT_INVITATION_REPOSITORY,
} from '../interfaces/tenant-invitation-repository.interface';
import { mapInvitationToResponse } from '../mappers/team.mapper';

@Injectable()
export class ListTeamInvitationsUseCase {
  constructor(
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Inject(TENANT_INVITATION_REPOSITORY)
    private readonly invitationRepository: ITenantInvitationRepository,
  ) {}

  async run(
    tenantId: string,
    status?: TenantInvitationStatus,
  ): Promise<TeamInvitationResponseDto[]> {
    await this.findTenantByIdUseCase.run(tenantId);
    const invitations = await this.invitationRepository.listByTenant(
      tenantId,
      status,
    );
    return invitations.map(mapInvitationToResponse);
  }
}
