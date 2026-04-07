import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityRepository } from 'src/repository/availability/availability.repository';
import { BarberServiceLinkEntity } from 'src/modules/availability/entities/barber-service-link.entity';
import { WorkingHoursEntity } from 'src/modules/availability/entities/working-hours.entity';
import { WorkingHoursPeriodEntity } from 'src/modules/availability/entities/working-hours-period.entity';
import { TimeOffEntity } from 'src/modules/availability/entities/time-off.entity';
import { BarberAvailabilityBlockEntity } from 'src/modules/availability/entities/barber-availability-block.entity';
import { DayOfWeek } from 'src/modules/availability/entities/day-of-week.enum';

describe('AvailabilityRepository', () => {
  let repository: AvailabilityRepository;
  let barberServiceRepo: jest.Mocked<Repository<BarberServiceLinkEntity>>;
  let workingHoursRepo: jest.Mocked<Repository<WorkingHoursEntity>>;
  let periodRepo: jest.Mocked<Repository<WorkingHoursPeriodEntity>>;
  let mockQb: {
    where: jest.Mock;
    andWhere: jest.Mock;
    innerJoin: jest.Mock;
    orderBy: jest.Mock;
    getOne: jest.Mock;
    getMany: jest.Mock;
    getExists: jest.Mock;
  };

  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const whId = 'wh-uuid';

  const mockWh: WorkingHoursEntity = {
    id: whId,
    tenantId,
    barberProfileId,
    dayOfWeek: DayOfWeek.MONDAY,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as WorkingHoursEntity;

  beforeEach(async () => {
    mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getExists: jest.fn(),
    };
    const mockBarberService = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    const mockWh = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };
    const mockPeriod = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      count: jest.fn(),
    };
    const mockTimeOff = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn(), softDelete: jest.fn() };
    const mockBlock = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn(), softDelete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityRepository,
        { provide: getRepositoryToken(BarberServiceLinkEntity), useValue: mockBarberService },
        { provide: getRepositoryToken(WorkingHoursEntity), useValue: mockWh },
        { provide: getRepositoryToken(WorkingHoursPeriodEntity), useValue: mockPeriod },
        { provide: getRepositoryToken(TimeOffEntity), useValue: mockTimeOff },
        { provide: getRepositoryToken(BarberAvailabilityBlockEntity), useValue: mockBlock },
      ],
    }).compile();

    repository = module.get(AvailabilityRepository);
    barberServiceRepo = module.get(getRepositoryToken(BarberServiceLinkEntity));
    workingHoursRepo = module.get(getRepositoryToken(WorkingHoursEntity));
    periodRepo = module.get(getRepositoryToken(WorkingHoursPeriodEntity));

    mockQb.getExists.mockResolvedValue(false);
    mockQb.getOne.mockResolvedValue(null);
    mockQb.getMany.mockResolvedValue([]);
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('createBarberServiceLink', () => {
    it('cria vínculo com isActive true', async () => {
      const link = { id: 'l1' } as BarberServiceLinkEntity;
      barberServiceRepo.create.mockReturnValue(link as any);
      barberServiceRepo.save.mockResolvedValue(link);

      const result = await repository.createBarberServiceLink({
        tenantId,
        barberProfileId,
        serviceId: 's1',
      });

      expect(barberServiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          barberProfileId,
          serviceId: 's1',
          isActive: true,
        }),
      );
      expect(result).toBe(link);
    });
  });

  describe('existsOtherWorkingHoursForDay', () => {
    it('retorna resultado de getExists', async () => {
      mockQb.getExists.mockResolvedValue(true);

      const result = await repository.existsOtherWorkingHoursForDay(
        barberProfileId,
        tenantId,
        DayOfWeek.TUESDAY,
      );

      expect(result).toBe(true);
      expect(workingHoursRepo.createQueryBuilder).toHaveBeenCalledWith('wh');
    });
  });

  describe('softDeleteWorkingHours', () => {
    it('soft delete períodos e jornada', async () => {
      workingHoursRepo.findOne.mockResolvedValue(mockWh);
      periodRepo.softDelete.mockResolvedValue({ affected: 1 } as any);
      workingHoursRepo.softDelete.mockResolvedValue({ affected: 1 } as any);

      await repository.softDeleteWorkingHours(whId, tenantId);

      expect(periodRepo.softDelete).toHaveBeenCalledWith({ workingHoursId: whId });
      expect(workingHoursRepo.softDelete).toHaveBeenCalledWith({ id: whId, tenantId });
    });
  });

  describe('findWorkingHoursById com períodos', () => {
    it('anexa períodos quando withPeriods true', async () => {
      workingHoursRepo.findOne.mockResolvedValue(mockWh);
      const periods = [
        { id: 'p1', workingHoursId: whId, startTime: '09:00', endTime: '12:00' },
      ] as WorkingHoursPeriodEntity[];
      periodRepo.find.mockResolvedValue(periods);

      const result = await repository.findWorkingHoursById(whId, tenantId, true);

      expect(periodRepo.find).toHaveBeenCalled();
      expect(result?.periods).toEqual(periods);
    });
  });
});
