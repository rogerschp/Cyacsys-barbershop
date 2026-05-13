import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AVAILABILITY_REPOSITORY } from '../../../modules/availability/interfaces/availability-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from '../../../modules/barber-profile/interfaces/barber-profile-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from '../../../modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BootstrapWorkingWeekUseCase } from '../../../modules/availability/use-cases/bootstrap-working-week.use-case';
import { DayOfWeek } from '../../../modules/availability/entities/day-of-week.enum';
import { TenantUserRole } from '../../../modules/tenant-user/entities/tenant-user-role.enum';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';

describe('BootstrapWorkingWeekUseCase', () => {
  let useCase: BootstrapWorkingWeekUseCase;
  let availabilityRepository: Record<string, jest.Mock>;
  let barberProfileRepository: { findById: jest.Mock };
  let findTenantUserByIdAndTenantUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const userId = 'user-uuid';

  beforeEach(async () => {
    availabilityRepository = {
      findWorkingHoursByBarberAndDay: jest
        .fn()
        .mockImplementation(() => Promise.resolve(null)),
      createWorkingHours: jest
        .fn()
        .mockImplementation((data: any) =>
          Promise.resolve({
            id: `wh-${data.dayOfWeek}`,
            dayOfWeek: data.dayOfWeek,
            isActive: data.isActive,
          }),
        ),
      createWorkingHoursPeriod: jest
        .fn()
        .mockImplementation(() => Promise.resolve({})),
      updateWorkingHours: jest
        .fn()
        .mockImplementation(() => Promise.resolve({})),
      listPeriodsByWorkingHoursId: jest
        .fn()
        .mockImplementation(() => Promise.resolve([])),
      softDeleteWorkingHoursPeriod: jest
        .fn()
        .mockImplementation(() => Promise.resolve(undefined)),
    };

    barberProfileRepository = {
      findById: jest
        .fn()
        .mockImplementation(() => Promise.resolve({ id: barberProfileId })),
    };

    findTenantUserByIdAndTenantUseCase = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapWorkingWeekUseCase,
        { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
        {
          provide: BARBER_PROFILE_REPOSITORY,
          useValue: barberProfileRepository,
        },
        {
          provide: FindTenantUserByIdAndTenantUseCase,
          useValue: findTenantUserByIdAndTenantUseCase,
        },
      ],
    }).compile();

    useCase = module.get(BootstrapWorkingWeekUseCase);
  });

  it('cria semana completa e fecha somente os dias informados', async () => {
    const result = await useCase.run(
      tenantId,
      barberProfileId,
      {
        closedDays: [DayOfWeek.SUNDAY],
        periods: [{ startTime: '09:00', endTime: '12:00' }],
      },
      userId,
      TenantUserRole.ADMIN,
    );

    expect(availabilityRepository.createWorkingHours).toHaveBeenCalledTimes(7);
    expect(availabilityRepository.createWorkingHours).toHaveBeenCalledWith(
      expect.objectContaining({
        dayOfWeek: DayOfWeek.SUNDAY,
        isActive: false,
      }),
    );
    expect(availabilityRepository.createWorkingHoursPeriod).toHaveBeenCalledTimes(
      6,
    );
    expect(result).toEqual({ created: 7, updated: 0, skipped: 0 });
  });

  it('atualiza agenda existente removendo períodos ao fechar um dia', async () => {
    availabilityRepository.findWorkingHoursByBarberAndDay.mockImplementation(
      (...args: any[]) => {
        const dayOfWeek = args[2];
        return Promise.resolve({ id: `existing-${dayOfWeek}`, dayOfWeek });
      },
    );
    availabilityRepository.listPeriodsByWorkingHoursId.mockImplementation(() =>
      Promise.resolve([{ id: 'p1' }, { id: 'p2' }]),
    );

    const result = await useCase.run(
      tenantId,
      barberProfileId,
      {
        closedDays: [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY],
        periods: [{ startTime: '09:00', endTime: '12:00' }],
        overwriteExisting: true,
      },
      userId,
      TenantUserRole.ADMIN,
    );

    expect(availabilityRepository.createWorkingHours).not.toHaveBeenCalled();
    expect(availabilityRepository.updateWorkingHours).toHaveBeenCalledTimes(7);
    expect(
      availabilityRepository.softDeleteWorkingHoursPeriod,
    ).toHaveBeenCalled();
    expect(result).toEqual({ created: 0, updated: 7, skipped: 0 });
  });

  it('lança erro quando períodos dos dias abertos não são informados', async () => {
    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        { closedDays: [DayOfWeek.SUNDAY], periods: [] },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });

  it('não sobrescreve jornadas existentes quando overwriteExisting=false', async () => {
    availabilityRepository.findWorkingHoursByBarberAndDay.mockImplementation(
      (...args: any[]) => {
        const dayOfWeek = args[2];
        return Promise.resolve({ id: `existing-${dayOfWeek}`, dayOfWeek });
      },
    );

    const result = await useCase.run(
      tenantId,
      barberProfileId,
      {
        closedDays: [DayOfWeek.SUNDAY],
        periods: [{ startTime: '09:00', endTime: '12:00' }],
        overwriteExisting: false,
      },
      userId,
      TenantUserRole.ADMIN,
    );

    expect(availabilityRepository.createWorkingHours).not.toHaveBeenCalled();
    expect(availabilityRepository.updateWorkingHours).not.toHaveBeenCalled();
    expect(
      availabilityRepository.softDeleteWorkingHoursPeriod,
    ).not.toHaveBeenCalled();
    expect(result).toEqual({ created: 0, updated: 0, skipped: 7 });
  });
});
