import { Injectable } from '@nestjs/common';
import {
  ITenantMembershipResolver,
  TenantMembershipInfo,
} from '../../../common/interfaces/tenant-membership-resolver.interface';
import { TenantUserService } from '../tenant-user.service';

/**
 * Adapta TenantUserService para o contrato ITenantMembershipResolver.
 * Permite que o TenantMembershipGuard (common) use a lógica de domínio do tenant-user.
 */
@Injectable()
export class TenantMembershipResolverAdapter implements ITenantMembershipResolver {
  constructor(private readonly tenantUserService: TenantUserService) {}

  async validateMembership(
    userId: string,
    tenantId: string,
  ): Promise<TenantMembershipInfo> {
    const entity = await this.tenantUserService.validateMembership(
      userId,
      tenantId,
    );
    return { role: entity.role };
  }
}
