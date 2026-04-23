import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkingHoursUseCase } from 'src/modules/availability/use-cases/create-working-hours.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { DayOfWeek } from 'src/modules/availability/entities/day-of-week.enum';
import { WorkingHoursEntity } from 'src/modules/availability/entities/working-hours.entity';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
describe('CreateWorkingHoursUseCase', () => {
  let useCase: CreateWorkingHoursUseCase;
  let availabilityRepository: {
    existsOtherWorkingHoursForDay: jest.Mock;
    createWorkingHours: jest.Mock;
    createWorkingHoursPeriod: jest.Mock;
    findWorkingHoursById: jest.Mock;
  };
  let barberProfileRepository: {
    findById: jest.Mock;
  };
  let tenantUserService: {
    getByIdAndTenant: jest.Mock;
  };
  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const userId = 'user-uuid';
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
    availabilityRepository = {
      existsOtherWorkingHoursForDay: jest.fn().mockResolvedValue(false),
      createWorkingHours: jest.fn().mockResolvedValue(mockWh),
      createWorkingHoursPeriod: jest.fn().mockResolvedValue({}),
      findWorkingHoursById: jest.fn().mockImplementation((_id, _t, withP) =>
        Promise.resolve(
          withP
            ? {
                ...mockWh,
                periods: [{ startTime: '09:00', endTime: '12:00' }],
              }
            : mockWh,
        ),
      ),
    };
    barberProfileRepository = {
      findById: jest.fn().mockResolvedValue({ id: barberProfileId }),
    };
    tenantUserService = {
      getByIdAndTenant: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkingHoursUseCase,
        { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
        {
          provide: BARBER_PROFILE_REPOSITORY,
          useValue: barberProfileRepository,
        },
        { provide: TenantUserService, useValue: tenantUserService },
      ],
    }).compile();
    useCase = module.get(CreateWorkingHoursUseCase);
  });
  it('cria jornada ativa com períodos', async () => {
    const result = await useCase.run(
      tenantId,
      barberProfileId,
      {
        dayOfWeek: DayOfWeek.MONDAY,
        isActive: true,
        periods: [{ startTime: '09:00', endTime: '12:00' }],
      },
      userId,
      TenantUserRole.ADMIN,
    );
    expect(availabilityRepository.createWorkingHours).toHaveBeenCalled();
    expect(
      availabilityRepository.createWorkingHoursPeriod,
    ).toHaveBeenCalledWith({
      workingHoursId: whId,
      startTime: '09:00',
      endTime: '12:00',
    });
    expect(result.id).toBe(whId);
  });
  it('lança WORKING_HOURS_ALREADY_EXISTS quando já existe dia', async () => {
    availabilityRepository.existsOtherWorkingHoursForDay.mockResolvedValue(
      true,
    );
    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        {
          dayOfWeek: DayOfWeek.MONDAY,
          isActive: true,
          periods: [{ startTime: '09:00', endTime: '12:00' }],
        },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
  it('lança WORKING_HOURS_ACTIVE_REQUIRES_PERIOD quando ativo sem períodos', async () => {
    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        { dayOfWeek: DayOfWeek.MONDAY, isActive: true, periods: [] },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
  it('permite jornada inativa sem períodos', async () => {
    await useCase.run(
      tenantId,
      barberProfileId,
      { dayOfWeek: DayOfWeek.TUESDAY, isActive: false },
      userId,
      TenantUserRole.ADMIN,
    );
    expect(
      availabilityRepository.createWorkingHoursPeriod,
    ).not.toHaveBeenCalled();
  });
});
