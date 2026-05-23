import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityRepository } from 'src/repository/availability/availability.repository';
import { ProfessionalServiceLinkEntity } from 'src/modules/availability/entities/professional-service-link.entity';
import { WorkingHoursEntity } from 'src/modules/availability/entities/working-hours.entity';
import { WorkingHoursPeriodEntity } from 'src/modules/availability/entities/working-hours-period.entity';
import { TimeOffEntity } from 'src/modules/availability/entities/time-off.entity';
import { ProfessionalAvailabilityBlockEntity } from 'src/modules/availability/entities/professional-availability-block.entity';
import { DayOfWeek } from 'src/modules/availability/entities/day-of-week.enum';
describe('AvailabilityRepository', () => {
  let repository: AvailabilityRepository;
  let professionalServiceLinkRepo: jest.Mocked<
    Repository<ProfessionalServiceLinkEntity>
  >;
  let workingHoursRepo: jest.Mocked<Repository<WorkingHoursEntity>>;
  let periodRepo: jest.Mocked<Repository<WorkingHoursPeriodEntity>>;
  let timeOffRepo: jest.Mocked<Repository<TimeOffEntity>>;
  let blockRepo: jest.Mocked<Repository<ProfessionalAvailabilityBlockEntity>>;
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
  const tenantProfessionalId = 'bp-uuid';
  const whId = 'wh-uuid';
  const mockWh: WorkingHoursEntity = {
    id: whId,
    tenantId,
    tenantProfessionalId,
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
    const mockProfessionalServiceLinkRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
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
    const mockTimeOff = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    const mockBlock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityRepository,
        {
          provide: getRepositoryToken(ProfessionalServiceLinkEntity),
          useValue: mockProfessionalServiceLinkRepo,
        },
        { provide: getRepositoryToken(WorkingHoursEntity), useValue: mockWh },
        {
          provide: getRepositoryToken(WorkingHoursPeriodEntity),
          useValue: mockPeriod,
        },
        { provide: getRepositoryToken(TimeOffEntity), useValue: mockTimeOff },
        {
          provide: getRepositoryToken(ProfessionalAvailabilityBlockEntity),
          useValue: mockBlock,
        },
      ],
    }).compile();
    repository = module.get(AvailabilityRepository);
    professionalServiceLinkRepo = module.get(
      getRepositoryToken(ProfessionalServiceLinkEntity),
    );
    workingHoursRepo = module.get(getRepositoryToken(WorkingHoursEntity));
    periodRepo = module.get(getRepositoryToken(WorkingHoursPeriodEntity));
    timeOffRepo = module.get(getRepositoryToken(TimeOffEntity));
    blockRepo = module.get(
      getRepositoryToken(ProfessionalAvailabilityBlockEntity),
    );
    mockQb.getExists.mockResolvedValue(false);
    mockQb.getOne.mockResolvedValue(null);
    mockQb.getMany.mockResolvedValue([]);
  });
  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });
  describe('createProfessionalServiceLink', () => {
    it('cria vínculo com isActive true', async () => {
      const link = { id: 'l1' } as ProfessionalServiceLinkEntity;
      professionalServiceLinkRepo.create.mockReturnValue(link as any);
      professionalServiceLinkRepo.save.mockResolvedValue(link);
      const result = await repository.createProfessionalServiceLink({
        tenantId,
        tenantProfessionalId,
        serviceId: 's1',
      });
      expect(professionalServiceLinkRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          tenantProfessionalId,
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
        tenantProfessionalId,
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
      expect(periodRepo.softDelete).toHaveBeenCalledWith({
        workingHoursId: whId,
      });
      expect(workingHoursRepo.softDelete).toHaveBeenCalledWith({
        id: whId,
        tenantId,
      });
    });
  });
  describe('findWorkingHoursById com períodos', () => {
    it('anexa períodos quando withPeriods true', async () => {
      workingHoursRepo.findOne.mockResolvedValue(mockWh);
      const periods = [
        {
          id: 'p1',
          workingHoursId: whId,
          startTime: '09:00',
          endTime: '12:00',
        },
      ] as WorkingHoursPeriodEntity[];
      periodRepo.find.mockResolvedValue(periods);
      const result = await repository.findWorkingHoursById(
        whId,
        tenantId,
        true,
      );
      expect(periodRepo.find).toHaveBeenCalled();
      expect(result?.periods).toEqual(periods);
    });

    it('retorna null quando jornada não existe', async () => {
      workingHoursRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.findWorkingHoursById(whId, tenantId, true),
      ).resolves.toBeNull();
    });
  });

  describe('professional service link', () => {
    const link = {
      id: 'l1',
      tenantId,
      tenantProfessionalId,
    } as ProfessionalServiceLinkEntity;

    it('findProfessionalServiceLinkById', async () => {
      professionalServiceLinkRepo.findOne.mockResolvedValue(link);
      await expect(
        repository.findProfessionalServiceLinkById('l1', tenantId),
      ).resolves.toBe(link);
    });

    it('findProfessionalServiceLinkByProfessionalAndService', async () => {
      professionalServiceLinkRepo.findOne.mockResolvedValue(link);
      await expect(
        repository.findProfessionalServiceLinkByProfessionalAndService(
          tenantProfessionalId,
          tenantId,
          's1',
        ),
      ).resolves.toBe(link);
    });

    it('listProfessionalServiceLinksByProfessional', async () => {
      professionalServiceLinkRepo.find.mockResolvedValue([link]);
      await expect(
        repository.listProfessionalServiceLinksByProfessional(
          tenantProfessionalId,
          tenantId,
        ),
      ).resolves.toEqual([link]);
    });

    it('updateProfessionalServiceLink', async () => {
      professionalServiceLinkRepo.update.mockResolvedValue({
        affected: 1,
      } as any);
      professionalServiceLinkRepo.findOne.mockResolvedValue(link);
      const res = await repository.updateProfessionalServiceLink(
        'l1',
        tenantId,
        { isActive: false },
      );
      expect(res).toBe(link);
    });

    it('updateProfessionalServiceLink lança se não encontrar após update', async () => {
      professionalServiceLinkRepo.update.mockResolvedValue({
        affected: 1,
      } as any);
      professionalServiceLinkRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.updateProfessionalServiceLink('l1', tenantId, {}),
      ).rejects.toThrow('Professional service link not found after update');
    });

    it('softDeleteProfessionalServiceLink', async () => {
      professionalServiceLinkRepo.findOne.mockResolvedValue(link);
      professionalServiceLinkRepo.softDelete.mockResolvedValue({
        affected: 1,
      } as any);
      await expect(
        repository.softDeleteProfessionalServiceLink('l1', tenantId),
      ).resolves.toBe(link);
    });

    it('softDeleteProfessionalServiceLink lança se não existe', async () => {
      professionalServiceLinkRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.softDeleteProfessionalServiceLink('l1', tenantId),
      ).rejects.toThrow('Professional service link not found');
    });
  });

  describe('working hours CRUD', () => {
    it('createWorkingHours', async () => {
      const created = { ...mockWh } as WorkingHoursEntity;
      workingHoursRepo.create.mockReturnValue(created as any);
      workingHoursRepo.save.mockResolvedValue(created);
      const res = await repository.createWorkingHours({
        tenantId,
        tenantProfessionalId,
        dayOfWeek: DayOfWeek.FRIDAY,
        isActive: true,
      });
      expect(res).toBe(created);
    });

    it('findWorkingHoursByProfessionalAndDay com períodos', async () => {
      workingHoursRepo.findOne.mockResolvedValue(mockWh);
      periodRepo.find.mockResolvedValue([] as any);
      const res = await repository.findWorkingHoursByProfessionalAndDay(
        tenantProfessionalId,
        tenantId,
        DayOfWeek.MONDAY,
        true,
      );
      expect(res?.periods).toEqual([]);
    });

    it('findWorkingHoursByProfessionalAndDay sem períodos não consulta periodRepo', async () => {
      workingHoursRepo.findOne.mockResolvedValue(mockWh);
      const res = await repository.findWorkingHoursByProfessionalAndDay(
        tenantProfessionalId,
        tenantId,
        DayOfWeek.MONDAY,
        false,
      );
      expect(res).toBe(mockWh);
      expect(periodRepo.find).not.toHaveBeenCalled();
    });

    it('listWorkingHoursByProfessional preenche períodos', async () => {
      workingHoursRepo.find.mockResolvedValue([mockWh]);
      periodRepo.find.mockResolvedValue([] as any);
      const list = await repository.listWorkingHoursByProfessional(
        tenantProfessionalId,
        tenantId,
      );
      expect(list).toHaveLength(1);
      expect(periodRepo.find).toHaveBeenCalled();
    });

    it('existsOtherWorkingHoursForDay com excludeWorkingHoursId', async () => {
      mockQb.getExists.mockResolvedValue(false);
      await repository.existsOtherWorkingHoursForDay(
        tenantProfessionalId,
        tenantId,
        DayOfWeek.MONDAY,
        'other-wh',
      );
      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('updateWorkingHours', async () => {
      workingHoursRepo.update.mockResolvedValue({ affected: 1 } as any);
      workingHoursRepo.findOne.mockResolvedValue(mockWh);
      const res = await repository.updateWorkingHours(whId, tenantId, {
        isActive: false,
      });
      expect(res).toBe(mockWh);
    });

    it('updateWorkingHours lança quando não encontrado', async () => {
      workingHoursRepo.update.mockResolvedValue({ affected: 1 } as any);
      workingHoursRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.updateWorkingHours(whId, tenantId, {}),
      ).rejects.toThrow('Working hours not found after update');
    });

    it('softDeleteWorkingHours lança quando não encontrado', async () => {
      workingHoursRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.softDeleteWorkingHours(whId, tenantId),
      ).rejects.toThrow('Working hours not found');
    });
  });

  describe('periods', () => {
    const period = {
      id: 'p1',
      workingHoursId: whId,
      startTime: '09:00',
      endTime: '12:00',
    } as WorkingHoursPeriodEntity;

    it('createWorkingHoursPeriod', async () => {
      periodRepo.create.mockReturnValue(period as any);
      periodRepo.save.mockResolvedValue(period);
      const res = await repository.createWorkingHoursPeriod({
        workingHoursId: whId,
        startTime: '09:00',
        endTime: '12:00',
      });
      expect(res).toBe(period);
    });

    it('findWorkingHoursPeriodById', async () => {
      mockQb.getOne.mockResolvedValue(period);
      await expect(
        repository.findWorkingHoursPeriodById('p1', tenantId),
      ).resolves.toBe(period);
      expect(periodRepo.createQueryBuilder).toHaveBeenCalledWith('p');
    });

    it('listPeriodsByWorkingHoursId', async () => {
      mockQb.getMany.mockResolvedValue([period]);
      const list = await repository.listPeriodsByWorkingHoursId(whId, tenantId);
      expect(list).toEqual([period]);
    });

    it('countActivePeriodsByWorkingHoursId', async () => {
      periodRepo.count.mockResolvedValue(2);
      await expect(
        repository.countActivePeriodsByWorkingHoursId(whId),
      ).resolves.toBe(2);
    });

    it('updateWorkingHoursPeriod', async () => {
      mockQb.getOne.mockResolvedValueOnce(period).mockResolvedValueOnce({
        ...period,
        endTime: '13:00',
      } as WorkingHoursPeriodEntity);
      periodRepo.update.mockResolvedValue({ affected: 1 } as any);
      const res = await repository.updateWorkingHoursPeriod('p1', tenantId, {
        endTime: '13:00',
      });
      expect(res.endTime).toBe('13:00');
    });

    it('updateWorkingHoursPeriod lança se período não existe', async () => {
      mockQb.getOne.mockResolvedValue(null);
      await expect(
        repository.updateWorkingHoursPeriod('p1', tenantId, {}),
      ).rejects.toThrow('Period not found');
    });

    it('updateWorkingHoursPeriod lança se não encontrado após update', async () => {
      mockQb.getOne.mockResolvedValueOnce(period).mockResolvedValueOnce(null);
      periodRepo.update.mockResolvedValue({ affected: 1 } as any);
      await expect(
        repository.updateWorkingHoursPeriod('p1', tenantId, {
          endTime: '13:00',
        }),
      ).rejects.toThrow('Period not found after update');
    });

    it('softDeleteWorkingHoursPeriod lança se período não existe', async () => {
      mockQb.getOne.mockResolvedValue(null);
      await expect(
        repository.softDeleteWorkingHoursPeriod('p1', tenantId),
      ).rejects.toThrow('Period not found');
    });

    it('softDeleteWorkingHoursPeriod', async () => {
      mockQb.getOne.mockResolvedValue(period);
      periodRepo.softDelete.mockResolvedValue({ affected: 1 } as any);
      await repository.softDeleteWorkingHoursPeriod('p1', tenantId);
      expect(periodRepo.softDelete).toHaveBeenCalledWith({ id: 'p1' });
    });
  });

  describe('time off', () => {
    const to = {
      id: 't1',
      tenantId,
      tenantProfessionalId,
      date: '2026-01-01',
    } as TimeOffEntity;

    it('createTimeOff', async () => {
      timeOffRepo.create.mockReturnValue(to as any);
      timeOffRepo.save.mockResolvedValue(to);
      const res = await repository.createTimeOff({
        tenantId,
        tenantProfessionalId,
        date: '2026-01-01',
        startTime: '09:00',
        endTime: '12:00',
        reason: 'HOLIDAY' as any,
      });
      expect(res).toBe(to);
    });

    it('findTimeOffById e listas', async () => {
      timeOffRepo.findOne.mockResolvedValue(to);
      await expect(repository.findTimeOffById('t1', tenantId)).resolves.toBe(
        to,
      );
      timeOffRepo.find.mockResolvedValue([to]);
      await expect(
        repository.listTimeOffsOnDate(
          tenantProfessionalId,
          tenantId,
          '2026-01-01',
        ),
      ).resolves.toEqual([to]);
      await expect(
        repository.listTimeOffsByProfessional(tenantProfessionalId, tenantId),
      ).resolves.toEqual([to]);
    });

    it('updateTimeOff', async () => {
      timeOffRepo.update.mockResolvedValue({ affected: 1 } as any);
      timeOffRepo.findOne.mockResolvedValue(to);
      await expect(
        repository.updateTimeOff('t1', tenantId, { reason: 'SICK' as any }),
      ).resolves.toBe(to);
    });

    it('updateTimeOff lança quando não encontrado após update', async () => {
      timeOffRepo.update.mockResolvedValue({ affected: 1 } as any);
      timeOffRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.updateTimeOff('t1', tenantId, {}),
      ).rejects.toThrow('Time off not found after update');
    });

    it('softDeleteTimeOff lança quando não existe', async () => {
      timeOffRepo.findOne.mockResolvedValue(null);
      await expect(
        repository.softDeleteTimeOff('t1', tenantId),
      ).rejects.toThrow('Time off not found');
    });

    it('softDeleteTimeOff', async () => {
      timeOffRepo.findOne.mockResolvedValue(to);
      timeOffRepo.softDelete.mockResolvedValue({ affected: 1 } as any);
      await expect(repository.softDeleteTimeOff('t1', tenantId)).resolves.toBe(
        to,
      );
    });
  });

  describe('blocks', () => {
    const blk = {
      id: 'b1',
      tenantId,
      tenantProfessionalId,
      date: '2026-01-02',
    } as ProfessionalAvailabilityBlockEntity;

    it('createBlock', async () => {
      blockRepo.create.mockReturnValue(blk as any);
      blockRepo.save.mockResolvedValue(blk);
      const res = await repository.createBlock({
        tenantId,
        tenantProfessionalId,
        date: '2026-01-02',
        startTime: '12:00',
        endTime: '13:00',
        reason: 'LUNCH' as any,
      });
      expect(res).toBe(blk);
      expect(blockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ bookingId: null }),
      );
    });

    it('createBlock com bookingId definido', async () => {
      blockRepo.create.mockReturnValue(blk as any);
      blockRepo.save.mockResolvedValue(blk);
      await repository.createBlock({
        tenantId,
        tenantProfessionalId,
        date: '2026-01-02',
        startTime: '12:00',
        endTime: '13:00',
        reason: 'LUNCH' as any,
        bookingId: 'book-1',
      });
      expect(blockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ bookingId: 'book-1' }),
      );
    });

    it('findBlockById e listas', async () => {
      blockRepo.findOne.mockResolvedValue(blk);
      await expect(repository.findBlockById('b1', tenantId)).resolves.toBe(blk);
      blockRepo.find.mockResolvedValue([blk]);
      await expect(
        repository.listBlocksOnDate(
          tenantProfessionalId,
          tenantId,
          '2026-01-02',
        ),
      ).resolves.toEqual([blk]);
      await expect(
        repository.listBlocksByProfessional(tenantProfessionalId, tenantId),
      ).resolves.toEqual([blk]);
    });

    it('updateBlock', async () => {
      blockRepo.update.mockResolvedValue({ affected: 1 } as any);
      blockRepo.findOne.mockResolvedValue(blk);
      await expect(
        repository.updateBlock('b1', tenantId, { startTime: '12:30' }),
      ).resolves.toBe(blk);
    });

    it('updateBlock lança quando não encontrado após update', async () => {
      blockRepo.update.mockResolvedValue({ affected: 1 } as any);
      blockRepo.findOne.mockResolvedValue(null);
      await expect(repository.updateBlock('b1', tenantId, {})).rejects.toThrow(
        'Block not found after update',
      );
    });

    it('softDeleteBlock lança quando não existe', async () => {
      blockRepo.findOne.mockResolvedValue(null);
      await expect(repository.softDeleteBlock('b1', tenantId)).rejects.toThrow(
        'Block not found',
      );
    });

    it('softDeleteBlock', async () => {
      blockRepo.findOne.mockResolvedValue(blk);
      blockRepo.softDelete.mockResolvedValue({ affected: 1 } as any);
      await expect(repository.softDeleteBlock('b1', tenantId)).resolves.toBe(
        blk,
      );
    });
  });
});
