import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AVAILABILITY_REPOSITORY } from '../../../modules/availability/interfaces/availability-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../../modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from '../../../modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BootstrapWorkingWeekUseCase } from '../../../modules/availability/use-cases/bootstrap-working-week.use-case';
import { DayOfWeek } from '../../../modules/availability/entities/day-of-week.enum';
import { TenantUserRole } from '../../../modules/tenant-user/entities/tenant-user-role.enum';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';

describe('BootstrapWorkingWeekUseCase', () => {
  let useCase: BootstrapWorkingWeekUseCase;
  let availabilityRepository: Record<string, jest.Mock>;
  let tenantProfessionalRepository: { findById: jest.Mock };
  let findTenantUserByIdAndTenantUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'bp-uuid';
  const userId = 'user-uuid';

  beforeEach(async () => {
    availabilityRepository = {
      findWorkingHoursByProfessionalAndDay: jest
        .fn()
        .mockImplementation(() => Promise.resolve(null)),
      createWorkingHours: jest.fn().mockImplementation((data: any) =>
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

    tenantProfessionalRepository = {
      findById: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ id: tenantProfessionalId }),
        ),
    };

    findTenantUserByIdAndTenantUseCase = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapWorkingWeekUseCase,
        { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepository,
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
      tenantProfessionalId,
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
    expect(
      availabilityRepository.createWorkingHoursPeriod,
    ).toHaveBeenCalledTimes(6);
    expect(result).toEqual({ created: 7, updated: 0, skipped: 0 });
  });

  it('atualiza agenda existente removendo períodos ao fechar um dia', async () => {
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockImplementation(
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
      tenantProfessionalId,
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

  it('lança NotFoundException quando tenantProfessionalId não existe no tenant', async () => {
    tenantProfessionalRepository.findById.mockImplementation(() =>
      Promise.resolve(null),
    );

    await expect(
      useCase.run(
        tenantId,
        'wrong-uuid',
        {
          closedDays: [DayOfWeek.SUNDAY],
          periods: [{ startTime: '09:00', endTime: '12:00' }],
        },
        userId,
        TenantUserRole.OWNER,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(availabilityRepository.createWorkingHours).not.toHaveBeenCalled();
  });

  it('lança erro quando períodos dos dias abertos não são informados', async () => {
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        { closedDays: [DayOfWeek.SUNDAY], periods: [] },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });

  it('não sobrescreve jornadas existentes quando overwriteExisting=false', async () => {
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockImplementation(
      (...args: any[]) => {
        const dayOfWeek = args[2];
        return Promise.resolve({ id: `existing-${dayOfWeek}`, dayOfWeek });
      },
    );

    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
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
