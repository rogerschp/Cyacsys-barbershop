import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { NotFoundException } from '@nestjs/common';
import { GetAvailableSlotsUseCase } from 'src/modules/availability/use-cases/get-available-slots.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';
import { DayOfWeek } from 'src/modules/availability/entities/day-of-week.enum';
import { TenantProfessionalEntity } from 'src/modules/tenant-professional/entities/tenant-professional.entity';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
import { ProfessionalServiceLinkEntity } from 'src/modules/availability/entities/professional-service-link.entity';
import { WorkingHoursEntity } from 'src/modules/availability/entities/working-hours.entity';
describe('GetAvailableSlotsUseCase', () => {
  let useCase: GetAvailableSlotsUseCase;
  let availabilityRepository: Record<string, jest.Mock>;
  let tenantProfessionalRepository: {
    findById: jest.Mock;
  };
  let serviceRepository: {
    findById: jest.Mock;
  };
  let findTenantByIdUseCase: {
    run: jest.Mock;
  };
  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'bp-uuid';
  const serviceId = 'service-uuid';
  const userId = 'user-uuid';
  const dateYmd = '2030-01-07';
  const mockTenant: TenantEntity = {
    id: tenantId,
    slug: 'loja',
    name: 'Loja',
    status: TenantStatus.ACTIVE,
    timezone: 'America/Sao_Paulo',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as TenantEntity;
  const mockTenantProfessional: TenantProfessionalEntity = {
    id: tenantProfessionalId,
    tenantId,
    professionalProfileId: 'pp-uuid',
    role: TenantUserRole.BARBER,
    status: TenantProfessionalStatus.ACTIVE,
    joinedAt: new Date(),
    leftAt: null,
    createdAt: new Date(),
    professionalProfile: {
      id: 'pp-uuid',
      userId,
      isActive: true,
    },
  } as TenantProfessionalEntity;
  const mockService: ServiceEntity = {
    id: serviceId,
    tenantId,
    name: 'Corte',
    description: null,
    price: '50.00',
    durationInMinutes: 60,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as ServiceEntity;
  const mockLink: ProfessionalServiceLinkEntity = {
    id: 'link-uuid',
    tenantId,
    tenantProfessionalId,
    serviceId,
    isActive: true,
    createdAt: new Date(),
    deletedAt: undefined,
  } as ProfessionalServiceLinkEntity;
  beforeEach(async () => {
    availabilityRepository = {
      findProfessionalServiceLinkByProfessionalAndService: jest
        .fn()
        .mockResolvedValue(mockLink),
      findWorkingHoursByProfessionalAndDay: jest.fn(),
      listTimeOffsOnDate: jest.fn().mockResolvedValue([]),
      listBlocksOnDate: jest.fn().mockResolvedValue([]),
    };
    tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue(mockTenantProfessional),
    };
    serviceRepository = {
      findById: jest.fn().mockResolvedValue(mockService),
    };
    findTenantByIdUseCase = {
      run: jest.fn().mockResolvedValue(mockTenant),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAvailableSlotsUseCase,
        { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepository,
        },
        { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
        { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
      ],
    }).compile();
    useCase = module.get(GetAvailableSlotsUseCase);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('retorna slots vazios quando não há jornada ativa', async () => {
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockResolvedValue(
      null,
    );
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(result.slots).toEqual([]);
    expect(result.timezone).toBe('America/Sao_Paulo');
  });
  it('lança TENANT_PROFESSIONAL_INACTIVE quando vínculo inativo', async () => {
    tenantProfessionalRepository.findById.mockResolvedValue({
      ...mockTenantProfessional,
      status: TenantProfessionalStatus.INACTIVE,
    });
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        serviceId,
        dateYmd,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
  it('lança NotFound quando serviço não existe', async () => {
    serviceRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        serviceId,
        dateYmd,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(NotFoundException);
  });
  it('lança PROFESSIONAL_SERVICE_NOT_OFFERED quando não há vínculo ativo', async () => {
    availabilityRepository.findProfessionalServiceLinkByProfessionalAndService.mockResolvedValue(
      null,
    );
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        serviceId,
        dateYmd,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
  it('gera slots 09:00, 10:00, 11:00 para período 09–12 e duração 60min', async () => {
    const wh: WorkingHoursEntity = {
      id: 'wh-1',
      tenantId,
      tenantProfessionalId,
      dayOfWeek: DayOfWeek.MONDAY,
      isActive: true,
      periods: [{ startTime: '09:00', endTime: '12:00' } as any],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as WorkingHoursEntity;
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockResolvedValue(wh);
    jest
      .spyOn(DateTime, 'now')
      .mockReturnValue(
        DateTime.fromObject(
          { year: 2030, month: 1, day: 7, hour: 7, minute: 0, second: 0 },
          { zone: 'America/Sao_Paulo' },
        ) as any,
      );
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(result.slots).toEqual(['09:00', '10:00', '11:00']);
  });
  it('retorna slots vazios quando jornada existe mas está inativa', async () => {
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockResolvedValue({
      ...({
        id: 'wh-1',
        tenantId,
        tenantProfessionalId,
        dayOfWeek: DayOfWeek.MONDAY,
        isActive: false,
        periods: [{ startTime: '09:00', endTime: '12:00' }],
      } as WorkingHoursEntity),
    });
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(result.slots).toEqual([]);
  });

  it('retorna slots vazios em folga de dia inteiro', async () => {
    const wh: WorkingHoursEntity = {
      id: 'wh-1',
      tenantId,
      tenantProfessionalId,
      dayOfWeek: DayOfWeek.MONDAY,
      isActive: true,
      periods: [{ startTime: '09:00', endTime: '12:00' } as any],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as WorkingHoursEntity;
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockResolvedValue(wh);
    availabilityRepository.listTimeOffsOnDate.mockResolvedValue([
      { startTime: null, endTime: null } as any,
    ]);
    jest
      .spyOn(DateTime, 'now')
      .mockReturnValue(
        DateTime.fromObject(
          { year: 2030, month: 1, day: 7, hour: 7, minute: 0, second: 0 },
          { zone: 'America/Sao_Paulo' },
        ) as any,
      );
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(result.slots).toEqual([]);
  });

  it('omite slot que colide com block', async () => {
    const wh: WorkingHoursEntity = {
      id: 'wh-1',
      tenantId,
      tenantProfessionalId,
      dayOfWeek: DayOfWeek.MONDAY,
      isActive: true,
      periods: [{ startTime: '09:00', endTime: '12:00' } as any],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as WorkingHoursEntity;
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockResolvedValue(wh);
    availabilityRepository.listBlocksOnDate.mockResolvedValue([
      { startTime: '10:00', endTime: '11:00' } as any,
    ]);
    jest
      .spyOn(DateTime, 'now')
      .mockReturnValue(
        DateTime.fromObject(
          { year: 2030, month: 1, day: 7, hour: 7, minute: 0, second: 0 },
          { zone: 'America/Sao_Paulo' },
        ) as any,
      );
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(result.slots).toEqual(['09:00', '11:00']);
  });

  it('omite slots com menos de 15 minutos de antecedência', async () => {
    const wh: WorkingHoursEntity = {
      id: 'wh-1',
      tenantId,
      tenantProfessionalId,
      dayOfWeek: DayOfWeek.MONDAY,
      isActive: true,
      periods: [{ startTime: '09:00', endTime: '12:00' } as any],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as WorkingHoursEntity;
    availabilityRepository.findWorkingHoursByProfessionalAndDay.mockResolvedValue(wh);
    jest
      .spyOn(DateTime, 'now')
      .mockReturnValue(
        DateTime.fromObject(
          { year: 2030, month: 1, day: 7, hour: 8, minute: 50, second: 0 },
          { zone: 'America/Sao_Paulo' },
        ) as any,
      );
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(result.slots).toEqual(['10:00', '11:00']);
  });
});
