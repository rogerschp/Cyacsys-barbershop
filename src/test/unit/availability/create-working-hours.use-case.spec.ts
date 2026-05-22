import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkingHoursUseCase } from 'src/modules/availability/use-cases/create-working-hours.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from 'src/modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
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
  let tenantProfessionalRepository: {
    findById: jest.Mock;
  };
  let findTenantUserByIdAndTenantUseCase: {
    run: jest.Mock;
  };
  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'bp-uuid';
  const userId = 'user-uuid';
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
    tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue({ id: tenantProfessionalId }),
    };
    findTenantUserByIdAndTenantUseCase = {
      run: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkingHoursUseCase,
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
    useCase = module.get(CreateWorkingHoursUseCase);
  });
  it('cria jornada ativa com períodos', async () => {
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
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
        tenantProfessionalId,
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
        tenantProfessionalId,
        { dayOfWeek: DayOfWeek.MONDAY, isActive: true, periods: [] },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
  it('permite jornada inativa sem períodos', async () => {
    await useCase.run(
      tenantId,
      tenantProfessionalId,
      { dayOfWeek: DayOfWeek.TUESDAY, isActive: false },
      userId,
      TenantUserRole.ADMIN,
    );
    expect(
      availabilityRepository.createWorkingHoursPeriod,
    ).not.toHaveBeenCalled();
  });
});
