import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TenantSubscriptionRepository } from 'src/repository/subscription/tenant-subscription.repository';
import { TenantSubscriptionEntity } from 'src/modules/subscription/entities/tenant-subscription.entity';
import { SubscriptionStatus } from 'src/modules/subscription/enums/subscription-status.enum';

describe('TenantSubscriptionRepository', () => {
  let repository: TenantSubscriptionRepository;
  let typeOrmRepo: jest.Mocked<Repository<TenantSubscriptionEntity>>;

  const mockSubscription = {
    id: 'sub-uuid',
    tenantId: 'tenant-uuid',
    planId: 'plan-uuid',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    gracePeriodEnd: null,
    gatewayCustomerId: null,
    gatewaySubId: null,
    cancelledAt: null,
    activatedBy: null,
    plan: { id: 'plan-uuid', gracePeriodDays: 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as TenantSubscriptionEntity;

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantSubscriptionRepository,
        {
          provide: getRepositoryToken(TenantSubscriptionEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(TenantSubscriptionRepository);
    typeOrmRepo = module.get(
      getRepositoryToken(TenantSubscriptionEntity),
    ) as jest.Mocked<Repository<TenantSubscriptionEntity>>;
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('cria assinatura com campos opcionais nulos', async () => {
      const data = {
        tenantId: 'tenant-uuid',
        planId: 'plan-uuid',
        status: SubscriptionStatus.ACTIVE,
      };
      typeOrmRepo.create.mockReturnValue(mockSubscription as any);
      typeOrmRepo.save.mockResolvedValue(mockSubscription);

      const result = await repository.create(data);

      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        tenantId: data.tenantId,
        planId: data.planId,
        status: data.status,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        gracePeriodEnd: null,
        activatedBy: null,
      });
      expect(result).toEqual(mockSubscription);
    });

    it('usa EntityManager quando informado', async () => {
      const managerRepo = {
        create: jest.fn().mockReturnValue(mockSubscription),
        save: jest.fn().mockResolvedValue(mockSubscription),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(managerRepo),
      } as unknown as EntityManager;

      const data = {
        tenantId: 'tenant-uuid',
        planId: 'plan-uuid',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        gracePeriodEnd: null,
        activatedBy: 'user-uuid',
      };

      const result = await repository.create(data, manager);

      expect(manager.getRepository).toHaveBeenCalledWith(
        TenantSubscriptionEntity,
      );
      expect(managerRepo.create).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('findByTenantId', () => {
    it('retorna assinatura pelo tenantId', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockSubscription);
      const result = await repository.findByTenantId('tenant-uuid');
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid' },
        withDeleted: false,
      });
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('findByTenantIdWithPlan', () => {
    it('retorna assinatura com relação plan', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockSubscription);
      const result = await repository.findByTenantIdWithPlan('tenant-uuid');
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid' },
        relations: ['plan'],
        withDeleted: false,
      });
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('update', () => {
    it('atualiza todos os campos informados', async () => {
      const now = new Date();
      typeOrmRepo.findOne.mockResolvedValue(mockSubscription);

      await repository.update('sub-uuid', {
        planId: 'plan-2',
        status: SubscriptionStatus.CANCELLED,
        currentPeriodStart: now,
        currentPeriodEnd: now,
        gracePeriodEnd: now,
        cancelledAt: now,
        activatedBy: 'admin-uuid',
      });

      expect(typeOrmRepo.update).toHaveBeenCalledWith(
        { id: 'sub-uuid' },
        {
          planId: 'plan-2',
          status: SubscriptionStatus.CANCELLED,
          currentPeriodStart: now,
          currentPeriodEnd: now,
          gracePeriodEnd: now,
          cancelledAt: now,
          activatedBy: 'admin-uuid',
        },
      );
    });

    it('lança erro quando entidade não existe após update', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.update('sub-uuid', { status: SubscriptionStatus.EXPIRED }),
      ).rejects.toThrow('TenantSubscription not found after update');
    });

    it('usa EntityManager quando informado', async () => {
      const managerRepo = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue(mockSubscription),
      };
      const manager = {
        getRepository: jest.fn().mockReturnValue(managerRepo),
      } as unknown as EntityManager;

      const result = await repository.update(
        'sub-uuid',
        { planId: 'plan-2' },
        manager,
      );

      expect(manager.getRepository).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });
  });

  describe('findExpiredActive', () => {
    it('busca assinaturas ACTIVE/CANCELLED com período vencido', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockSubscription]);
      const now = new Date('2026-01-01');

      const result = await repository.findExpiredActive(now);

      expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('ts');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'ts.status IN (:...statuses)',
        {
          statuses: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.CANCELLED,
          ],
        },
      );
      expect(result).toEqual([mockSubscription]);
    });
  });

  describe('findExpiredGracePeriod', () => {
    it('busca assinaturas em GRACE_PERIOD com grace vencido', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockSubscription]);
      const now = new Date('2026-01-01');

      const result = await repository.findExpiredGracePeriod(now);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('ts.status = :status', {
        status: SubscriptionStatus.GRACE_PERIOD,
      });
      expect(result).toEqual([mockSubscription]);
    });
  });
});
