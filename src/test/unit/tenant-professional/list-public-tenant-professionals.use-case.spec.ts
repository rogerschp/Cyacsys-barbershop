import { Test, TestingModule } from '@nestjs/testing';
import { ListPublicTenantProfessionalsUseCase } from 'src/modules/tenant-professional/use-cases/list-public-tenant-professionals.use-case';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';

describe('ListPublicTenantProfessionalsUseCase', () => {
  let useCase: ListPublicTenantProfessionalsUseCase;
  const repo = { listByTenant: jest.fn() };
  const findTenant = { run: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPublicTenantProfessionalsUseCase,
        { provide: TENANT_PROFESSIONAL_REPOSITORY, useValue: repo },
        { provide: FindTenantByIdUseCase, useValue: findTenant },
      ],
    }).compile();
    useCase = module.get(ListPublicTenantProfessionalsUseCase);
    jest.clearAllMocks();
    findTenant.run.mockResolvedValue({
      id: 't1',
      status: TenantStatus.ACTIVE,
    });
  });

  it('lista apenas ativos mapeados para DTO público', async () => {
    repo.listByTenant.mockResolvedValue([
      {
        id: 'tp1',
        tenantId: 't1',
        status: TenantProfessionalStatus.ACTIVE,
        professionalProfile: {
          displayName: 'Ana',
          bio: null,
          avatarUrl: 'https://x/a.png',
          professionalType: ProfessionalType.BARBER,
          bookingMode: BookingMode.DIRECT_BOOKING,
          whatsappNumber: '5511999999999',
          instagramUsername: 'ana',
        },
      },
    ]);

    const result = await useCase.run('t1');
    expect(repo.listByTenant).toHaveBeenCalledWith('t1', { activeOnly: true });
    expect(result).toEqual([
      expect.objectContaining({
        id: 'tp1',
        displayName: 'Ana',
        bookingMode: BookingMode.DIRECT_BOOKING,
      }),
    ]);
    expect(result[0]).not.toHaveProperty('role');
  });

  it('bloqueia tenant inativo', async () => {
    findTenant.run.mockResolvedValue({
      id: 't1',
      status: TenantStatus.INACTIVE,
    });
    await expect(useCase.run('t1')).rejects.toBeInstanceOf(
      TenantForbiddenException,
    );
  });
});
