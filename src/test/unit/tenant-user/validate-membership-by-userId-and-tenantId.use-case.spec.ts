import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from 'src/modules/tenant-user/use-cases/validate-membership-by-userId-and-tenantId.use-case';
import { TENANT_USER_REPOSITORY } from 'src/modules/tenant-user/interfaces/tenant-user-repository.interface';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('ValidateMembershipByUserIdAndTenantIdUseCase', () => {
  let useCase: ValidateMembershipByUserIdAndTenantIdUseCase;
  let findByTenantAndUser: jest.Mock;

  const userId = 'user-uuid';
  const tenantId = 'tenant-uuid';

  beforeEach(async () => {
    findByTenantAndUser = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateMembershipByUserIdAndTenantIdUseCase,
        {
          provide: TENANT_USER_REPOSITORY,
          useValue: { findByTenantAndUser },
        },
      ],
    }).compile();
    useCase = module.get(ValidateMembershipByUserIdAndTenantIdUseCase);
  });

  it('queries repository with tenantId then userId', async () => {
    findByTenantAndUser.mockResolvedValue({
      id: 'link-uuid',
      tenantId,
      userId,
      role: TenantUserRole.OWNER,
      status: TenantUserStatus.ACTIVE,
    });

    await useCase.run(userId, tenantId);

    expect(findByTenantAndUser).toHaveBeenCalledWith(tenantId, userId);
  });

  it('throws NotFoundException when membership is missing', async () => {
    findByTenantAndUser.mockResolvedValue(null);

    await expect(useCase.run(userId, tenantId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException when membership is inactive', async () => {
    findByTenantAndUser.mockResolvedValue({
      id: 'link-uuid',
      tenantId,
      userId,
      role: TenantUserRole.OWNER,
      status: TenantUserStatus.INACTIVE,
    });

    await expect(useCase.run(userId, tenantId)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
