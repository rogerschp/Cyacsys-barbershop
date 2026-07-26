import { Inject, Injectable } from '@nestjs/common';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../../tenant-user/interfaces/tenant-user-repository.interface';
import { TeamMemberResponseDto } from '../dto/team-response.dto';
import { mapMembershipToTeamMember } from '../mappers/team.mapper';

@Injectable()
export class ListTeamMembersUseCase {
  constructor(
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Inject(TENANT_USER_REPOSITORY)
    private readonly tenantUserRepository: ITenantUserRepository,
  ) {}

  async run(tenantId: string): Promise<TeamMemberResponseDto[]> {
    await this.findTenantByIdUseCase.run(tenantId);
    const members = await this.tenantUserRepository.listByTenantId(tenantId);
    return members.map(mapMembershipToTeamMember);
  }
}
