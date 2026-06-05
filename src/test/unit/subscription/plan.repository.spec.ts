import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanRepository } from 'src/repository/subscription/plan.repository';
import { PlanEntity } from 'src/modules/subscription/entities/plan.entity';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { BillingCycle } from 'src/modules/subscription/enums/billing-cycle.enum';

describe('PlanRepository', () => {
  let repository: PlanRepository;
  let typeOrmRepo: jest.Mocked<Repository<PlanEntity>>;

  const mockPlan: PlanEntity = {
    id: 'plan-uuid',
    name: PlanName.STANDARD,
    billingCycle: BillingCycle.MONTHLY,
    price: '89.90',
    sortWeight: 1,
    gracePeriodDays: 5,
    features: {
      reports: 'BASIC',
      reportExport: false,
      reviews: true,
      marketplace: true,
      regionalHighlight: false,
      eliteBadge: false,
      whatsappNotification: false,
      customization: 'BASIC',
      maxProfessionals: null,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PlanEntity;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanRepository,
        {
          provide: getRepositoryToken(PlanEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(PlanRepository);
    typeOrmRepo = module.get(getRepositoryToken(PlanEntity)) as jest.Mocked<
      Repository<PlanEntity>
    >;
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('findAllActive', () => {
    it('retorna planos ativos ordenados', async () => {
      typeOrmRepo.find.mockResolvedValue([mockPlan]);
      const result = await repository.findAllActive();
      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortWeight: 'ASC' },
        withDeleted: false,
      });
      expect(result).toEqual([mockPlan]);
    });
  });

  describe('findByName', () => {
    it('retorna plano pelo nome', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockPlan);
      const result = await repository.findByName(PlanName.STANDARD);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { name: PlanName.STANDARD },
        withDeleted: false,
      });
      expect(result).toEqual(mockPlan);
    });

    it('retorna null quando não existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByName(PlanName.ELITE);
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('retorna plano pelo id', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockPlan);
      const result = await repository.findById('plan-uuid');
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'plan-uuid' },
        withDeleted: false,
      });
      expect(result).toEqual(mockPlan);
    });
  });
});
