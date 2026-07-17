import { Test, TestingModule } from '@nestjs/testing';
import { ListPublicTenantServicesUseCase } from 'src/modules/service/use-cases/list-public-tenant-services.use-case';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';

describe('ListPublicTenantServicesUseCase', () => {
  let useCase: ListPublicTenantServicesUseCase;
  const repo = { listByTenant: jest.fn() };
  const findTenant = { run: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPublicTenantServicesUseCase,
        { provide: SERVICE_REPOSITORY, useValue: repo },
        { provide: FindTenantByIdUseCase, useValue: findTenant },
      ],
    }).compile();
    useCase = module.get(ListPublicTenantServicesUseCase);
    jest.clearAllMocks();
    findTenant.run.mockResolvedValue({
      id: 't1',
      status: TenantStatus.ACTIVE,
    });
  });

  it('filtra só serviços ativos', async () => {
    repo.listByTenant.mockResolvedValue([
      { id: 's1', name: 'Corte', isActive: true },
      { id: 's2', name: 'Barba', isActive: false },
    ]);
    const result = await useCase.run('t1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });
});
