import { Injectable } from '@nestjs/common';
import {
  ITenantMembershipResolver,
  TenantMembershipInfo,
} from '../../../common/interfaces/tenant-membership-resolver.interface';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from '../use-cases/validate-membership-by-userId-and-tenantId.use-case';
@Injectable()
export class TenantMembershipResolverAdapter implements ITenantMembershipResolver {
  constructor(
    private readonly validateMembershipByUserIdAndTenantIdUseCase: ValidateMembershipByUserIdAndTenantIdUseCase,
  ) {}
  async validateMembership(
    userId: string,
    tenantId: string,
  ): Promise<TenantMembershipInfo> {
    const entity = await this.validateMembershipByUserIdAndTenantIdUseCase.run(
      userId,
      tenantId,
    );
    return { role: entity.role };
  }
}
