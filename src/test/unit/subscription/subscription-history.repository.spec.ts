import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SubscriptionHistoryRepository } from 'src/repository/subscription/subscription-history.repository';
import { SubscriptionHistoryEntity } from 'src/modules/subscription/entities/subscription-history.entity';
import { SubscriptionEvent } from 'src/modules/subscription/enums/subscription-event.enum';

describe('SubscriptionHistoryRepository', () => {
  let repository: SubscriptionHistoryRepository;
  let typeOrmRepo: jest.Mocked<Repository<SubscriptionHistoryEntity>>;

  const mockHistory = {
    id: 'hist-uuid',
    tenantId: 'tenant-uuid',
    subscriptionId: 'sub-uuid',
    event: SubscriptionEvent.CREATED,
    fromPlanId: null,
    toPlanId: 'plan-uuid',
    performedBy: 'user-uuid',
    createdAt: new Date(),
  } as SubscriptionHistoryEntity;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionHistoryRepository,
        {
          provide: getRepositoryToken(SubscriptionHistoryEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(SubscriptionHistoryRepository);
    typeOrmRepo = module.get(
      getRepositoryToken(SubscriptionHistoryEntity),
    ) as jest.Mocked<Repository<SubscriptionHistoryEntity>>;
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('cria histórico com planIds nulos por padrão', async () => {
      const data = {
        tenantId: 'tenant-uuid',
        subscriptionId: 'sub-uuid',
        event: SubscriptionEvent.CREATED,
        performedBy: 'user-uuid',
      };
      typeOrmRepo.create.mockReturnValue(mockHistory as any);
      typeOrmRepo.save.mockResolvedValue(mockHistory);

      const result = await repository.create(data);

      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        tenantId: data.tenantId,
        subscriptionId: data.subscriptionId,
        event: data.event,
        fromPlanId: null,
        toPlanId: null,
        performedBy: data.performedBy,
      });
      expect(result).toEqual(mockHistory);
    });

    it('persiste fromPlanId e toPlanId quando informados', async () => {
      const data = {
        tenantId: 'tenant-uuid',
        subscriptionId: 'sub-uuid',
        event: SubscriptionEvent.UPGRADED,
        fromPlanId: 'plan-1',
        toPlanId: 'plan-2',
        performedBy: 'admin-uuid',
      };
      typeOrmRepo.create.mockReturnValue(mockHistory as any);
      typeOrmRepo.save.mockResolvedValue(mockHistory);

      await repository.create(data);

      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        ...data,
        fromPlanId: 'plan-1',
        toPlanId: 'plan-2',
      });
    });

    it('usa EntityManager quando informado', async () => {
      const managerRepo = {
        create: jest.fn().mockReturnValue(mockHistory),
        save: jest.fn().mockResolvedValue(mockHistory),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(managerRepo),
      } as unknown as EntityManager;

      const data = {
        tenantId: 'tenant-uuid',
        subscriptionId: 'sub-uuid',
        event: SubscriptionEvent.MANUALLY_ACTIVATED,
        performedBy: 'system',
      };

      await repository.create(data, manager);

      expect(manager.getRepository).toHaveBeenCalledWith(
        SubscriptionHistoryEntity,
      );
      expect(managerRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByTenantId', () => {
    it('retorna histórico ordenado por createdAt DESC', async () => {
      typeOrmRepo.find.mockResolvedValue([mockHistory]);
      const result = await repository.findByTenantId('tenant-uuid');

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid' },
        order: { createdAt: 'DESC' },
        withDeleted: false,
      });
      expect(result).toEqual([mockHistory]);
    });
  });
});
