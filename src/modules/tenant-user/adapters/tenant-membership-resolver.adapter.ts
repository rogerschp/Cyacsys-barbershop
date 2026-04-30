import { Injectable } from '@nestjs/common';
import {
  ITenantMembershipResolver,
  TenantMembershipInfo,
} from '../../../common/interfaces/tenant-membership-resolver.interface';
import { TenantUserService } from '../tenant-user.service';
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
