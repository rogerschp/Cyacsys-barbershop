import { Inject, Injectable } from '@nestjs/common';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';
import { MyTenantResponseDto } from '../dto/my-tenant-response.dto';

@Injectable()
export class ListMyTenantsUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly tenantUserRepository: ITenantUserRepository,
  ) {}

  async run(userId: string): Promise<MyTenantResponseDto[]> {
    const memberships =
      await this.tenantUserRepository.listActiveByUserId(userId);

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      status: m.status,
      tenant: {
        id: m.tenant.id,
        slug: m.tenant.slug,
        name: m.tenant.name,
        status: m.tenant.status,
        telephone: m.tenant.telephone,
        timezone: m.tenant.timezone,
        segment: m.tenant.segment ?? null,
        logoMediaId: m.tenant.logoMediaId ?? null,
        avatarUrl: m.tenant.logoMedia?.url ?? null,
        clientCanCancelConfirmed: m.tenant.clientCanCancelConfirmed,
        clientCancelConfirmedMinLeadMinutes:
          m.tenant.clientCancelConfirmedMinLeadMinutes,
      },
    }));
  }
}
