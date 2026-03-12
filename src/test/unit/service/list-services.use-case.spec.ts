import { Test, TestingModule } from '@nestjs/testing';
import { ListServicesByTenantUseCase } from 'src/modules/service/use-cases/list-services.use-case';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';

describe('ListServicesByTenantUseCase', () => {
  let useCase: ListServicesByTenantUseCase;
  let serviceRepository: { listByTenant: jest.Mock };

  const tenantId = 'tenant-uuid';
  const mockServices: ServiceEntity[] = [
    {
      id: 's1',
      tenantId,
      name: 'Corte',
      description: null,
      price: '30.00',
      durationInMinutes: 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as ServiceEntity,
  ];

  beforeEach(async () => {
    serviceRepository = {
      listByTenant: jest.fn().mockResolvedValue(mockServices),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListServicesByTenantUseCase,
        { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
      ],
    }).compile();

    useCase = module.get<ListServicesByTenantUseCase>(
      ListServicesByTenantUseCase,
    );
  });

  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });

  describe('run', () => {
    it('deve retornar lista de serviços do tenant', async () => {
      const result = await useCase.run(tenantId);

      expect(serviceRepository.listByTenant).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(mockServices);
    });

    it('deve retornar array vazio quando tenant não tem serviços', async () => {
      serviceRepository.listByTenant.mockResolvedValue([]);

      const result = await useCase.run(tenantId);

      expect(result).toEqual([]);
    });
  });
});
