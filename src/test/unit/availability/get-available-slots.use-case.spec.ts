import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { NotFoundException } from '@nestjs/common';
import { GetAvailableSlotsUseCase } from 'src/modules/availability/use-cases/get-available-slots.use-case';
import { AVAILABILITY_REPOSITORY } from 'src/modules/availability/interfaces/availability-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';
import { DayOfWeek } from 'src/modules/availability/entities/day-of-week.enum';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
import { BarberServiceLinkEntity } from 'src/modules/availability/entities/barber-service-link.entity';
import { WorkingHoursEntity } from 'src/modules/availability/entities/working-hours.entity';

describe('GetAvailableSlotsUseCase', () => {
  let useCase: GetAvailableSlotsUseCase;
  let availabilityRepository: Record<string, jest.Mock>;
  let barberProfileRepository: { findById: jest.Mock };
  let serviceRepository: { findById: jest.Mock };
  let tenantUserService: Record<string, jest.Mock>;
  let tenantService: { findById: jest.Mock };

  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const serviceId = 'service-uuid';
  const userId = 'user-uuid';
  /** Segunda-feira em America/Sao_Paulo */
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

  const mockBarber: BarberProfileEntity = {
    id: barberProfileId,
    tenantId,
    tenantUserId: 'tu-uuid',
    displayName: 'João',
    bio: null,
    avatarUrl: 'https://x.com/a.jpg',
    experienceYears: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as BarberProfileEntity;

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

  const mockLink: BarberServiceLinkEntity = {
    id: 'link-uuid',
    tenantId,
    barberProfileId,
    serviceId,
    isActive: true,
    createdAt: new Date(),
    deletedAt: undefined,
  } as BarberServiceLinkEntity;

  beforeEach(async () => {
    availabilityRepository = {
      findBarberServiceLinkByBarberAndService: jest
        .fn()
        .mockResolvedValue(mockLink),
      findWorkingHoursByBarberAndDay: jest.fn(),
      listTimeOffsOnDate: jest.fn().mockResolvedValue([]),
      listBlocksOnDate: jest.fn().mockResolvedValue([]),
    };
    barberProfileRepository = {
      findById: jest.fn().mockResolvedValue(mockBarber),
    };
    serviceRepository = {
      findById: jest.fn().mockResolvedValue(mockService),
    };
    tenantUserService = {};
    tenantService = {
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAvailableSlotsUseCase,
        { provide: AVAILABILITY_REPOSITORY, useValue: availabilityRepository },
        {
          provide: BARBER_PROFILE_REPOSITORY,
          useValue: barberProfileRepository,
        },
        { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
        { provide: TenantUserService, useValue: tenantUserService },
        { provide: TenantService, useValue: tenantService },
      ],
    }).compile();

    useCase = module.get(GetAvailableSlotsUseCase);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retorna slots vazios quando não há jornada ativa', async () => {
    availabilityRepository.findWorkingHoursByBarberAndDay.mockResolvedValue(
      null,
    );

    const result = await useCase.run(
      tenantId,
      barberProfileId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );

    expect(result.slots).toEqual([]);
    expect(result.timezone).toBe('America/Sao_Paulo');
  });

  it('lança BARBER_INACTIVE quando barbeiro inativo', async () => {
    barberProfileRepository.findById.mockResolvedValue({
      ...mockBarber,
      isActive: false,
    });

    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
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
        barberProfileId,
        serviceId,
        dateYmd,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança BARBER_SERVICE_NOT_OFFERED quando não há vínculo ativo', async () => {
    availabilityRepository.findBarberServiceLinkByBarberAndService.mockResolvedValue(
      null,
    );

    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
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
      barberProfileId,
      dayOfWeek: DayOfWeek.MONDAY,
      isActive: true,
      periods: [{ startTime: '09:00', endTime: '12:00' } as any],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as WorkingHoursEntity;

    availabilityRepository.findWorkingHoursByBarberAndDay.mockResolvedValue(wh);

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
      barberProfileId,
      serviceId,
      dateYmd,
      userId,
      TenantUserRole.ADMIN,
    );

    expect(result.slots).toEqual(['09:00', '10:00', '11:00']);
  });
});
