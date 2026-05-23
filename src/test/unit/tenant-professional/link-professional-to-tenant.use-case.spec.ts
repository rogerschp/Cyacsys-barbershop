import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LinkProfessionalToTenantUseCase } from 'src/modules/tenant-professional/use-cases/link-professional-to-tenant.use-case';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { TenantProfessionalEntity } from 'src/modules/tenant-professional/entities/tenant-professional.entity';

describe('LinkProfessionalToTenantUseCase', () => {
  let useCase: LinkProfessionalToTenantUseCase;
  let tenantProfessionalRepository: any;
  let professionalProfileRepository: any;

  const tenantId = 'tenant-uuid';
  const profileId = 'profile-uuid';
  const mockProfile = {
    id: profileId,
    userId: 'user-uuid',
    isActive: true,
    professionalType: ProfessionalType.BARBER,
    bookingMode: BookingMode.DIRECT_BOOKING,
  };

  beforeEach(async () => {
    tenantProfessionalRepository = {
      findByTenantAndProfile: jest
        .fn<() => Promise<null>>()
        .mockResolvedValue(null),
      create: jest
        .fn<() => Promise<TenantProfessionalEntity>>()
        .mockResolvedValue({
          id: 'tp-uuid',
          tenantId,
          professionalProfileId: profileId,
          role: TenantUserRole.BARBER,
          status: TenantProfessionalStatus.ACTIVE,
        } as TenantProfessionalEntity),
      update: jest.fn(),
    };
    professionalProfileRepository = {
      findById: jest
        .fn<() => Promise<typeof mockProfile>>()
        .mockResolvedValue(mockProfile),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkProfessionalToTenantUseCase,
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepository,
        },
        {
          provide: PROFESSIONAL_PROFILE_REPOSITORY,
          useValue: professionalProfileRepository,
        },
        {
          provide: FindTenantByIdUseCase,
          useValue: {
            run: jest.fn<() => Promise<object>>().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    useCase = module.get(LinkProfessionalToTenantUseCase);
  });

  it('cria vínculo quando perfil existe e não há vínculo', async () => {
    const result = await useCase.run(
      tenantId,
      { professionalProfileId: profileId, role: TenantUserRole.BARBER },
      'admin-uuid',
    );
    expect(tenantProfessionalRepository.create).toHaveBeenCalled();
    expect(result.id).toBe('tp-uuid');
  });

  it('lança quando perfil inativo', async () => {
    professionalProfileRepository.findById.mockResolvedValue({
      ...mockProfile,
      isActive: false,
    });
    await expect(
      useCase.run(
        tenantId,
        { professionalProfileId: profileId, role: TenantUserRole.BARBER },
        'admin-uuid',
      ),
    ).rejects.toThrow(BusinessRuleException);
  });

  it('lança TENANT_PROFESSIONAL_ALREADY_ACTIVE', async () => {
    tenantProfessionalRepository.findByTenantAndProfile.mockResolvedValue({
      status: TenantProfessionalStatus.ACTIVE,
    });
    await expect(
      useCase.run(
        tenantId,
        { professionalProfileId: profileId, role: TenantUserRole.BARBER },
        'admin-uuid',
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
});
