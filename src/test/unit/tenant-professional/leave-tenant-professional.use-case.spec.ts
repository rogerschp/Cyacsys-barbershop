import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LeaveTenantProfessionalUseCase } from 'src/modules/tenant-professional/use-cases/leave-tenant-professional.use-case';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('LeaveTenantProfessionalUseCase', () => {
  let useCase: LeaveTenantProfessionalUseCase;
  let tenantProfessionalRepository: any;

  const tenantId = 'tenant-uuid';
  const tpId = 'tp-uuid';
  const userId = 'user-uuid';

  beforeEach(async () => {
    tenantProfessionalRepository = {
      findById: jest.fn<() => Promise<object>>().mockResolvedValue({
        id: tpId,
        status: TenantProfessionalStatus.ACTIVE,
        professionalProfile: { userId },
      }),
      update: jest
        .fn<() => Promise<{ status: TenantProfessionalStatus }>>()
        .mockResolvedValue({ status: TenantProfessionalStatus.LEFT }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveTenantProfessionalUseCase,
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepository,
        },
      ],
    }).compile();

    useCase = module.get(LeaveTenantProfessionalUseCase);
  });

  it('permite profissional encerrar o próprio vínculo', async () => {
    await useCase.run(tenantId, tpId, userId, TenantUserRole.BARBER);
    expect(tenantProfessionalRepository.update).toHaveBeenCalledWith(
      tpId,
      tenantId,
      expect.objectContaining({ status: TenantProfessionalStatus.LEFT }),
    );
  });

  it('lança ForbiddenException para outro barbeiro', async () => {
    await expect(
      useCase.run(tenantId, tpId, 'other-user', TenantUserRole.BARBER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lança NotFoundException quando vínculo não existe', async () => {
    tenantProfessionalRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.run(tenantId, tpId, userId, TenantUserRole.ADMIN),
    ).rejects.toThrow(NotFoundException);
  });
});
