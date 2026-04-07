import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreateBookingDraftUseCase } from 'src/modules/booking/use-cases/create-booking-draft.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { SERVICE_REPOSITORY } from 'src/modules/service/interfaces/service-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { GetAvailableSlotsUseCase } from 'src/modules/availability/use-cases/get-available-slots.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('CreateBookingDraftUseCase', () => {
  let useCase: CreateBookingDraftUseCase;
  let bookingRepository: { createDraft: jest.Mock };
  let barberProfileRepository: { findById: jest.Mock };
  let serviceRepository: { findById: jest.Mock };
  let tenantUserService: { validateMembership: jest.Mock };
  let tenantService: { findById: jest.Mock };
  let getAvailableSlotsUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const userId = 'user-uuid';
  const serviceId = 'svc-uuid';
  const date = '2099-06-15';

  const mockBooking: BookingEntity = {
    id: 'booking-uuid',
    tenantId,
    barberProfileId,
    serviceId,
    startsAt: new Date(),
    endsAt: new Date(),
    status: BookingStatus.DRAFT,
    createdByTenantUserId: 'tu-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BookingEntity;

  beforeEach(async () => {
    bookingRepository = {
      createDraft: jest.fn().mockResolvedValue(mockBooking),
    };
    barberProfileRepository = {
      findById: jest.fn().mockResolvedValue({
        id: barberProfileId,
        isActive: true,
      }),
    };
    serviceRepository = {
      findById: jest.fn().mockResolvedValue({
        id: serviceId,
        isActive: true,
        durationInMinutes: 30,
      }),
    };
    tenantUserService = {
      validateMembership: jest.fn().mockResolvedValue({ id: 'tu-uuid' }),
    };
    tenantService = {
      findById: jest.fn().mockResolvedValue({
        id: tenantId,
        timezone: 'America/Sao_Paulo',
      }),
    };
    getAvailableSlotsUseCase = {
      run: jest.fn().mockResolvedValue({
        date,
        timezone: 'America/Sao_Paulo',
        slots: ['10:00', '10:30'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookingDraftUseCase,
        { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
        {
          provide: BARBER_PROFILE_REPOSITORY,
          useValue: barberProfileRepository,
        },
        { provide: SERVICE_REPOSITORY, useValue: serviceRepository },
        { provide: TenantUserService, useValue: tenantUserService },
        { provide: TenantService, useValue: tenantService },
        { provide: GetAvailableSlotsUseCase, useValue: getAvailableSlotsUseCase },
      ],
    }).compile();

    useCase = module.get(CreateBookingDraftUseCase);
  });

  it('cria rascunho quando o slot está disponível', async () => {
    const result = await useCase.run(
      tenantId,
      barberProfileId,
      { serviceId, date, startTime: '10:00' },
      userId,
      TenantUserRole.ADMIN,
    );

    expect(getAvailableSlotsUseCase.run).toHaveBeenCalledWith(
      tenantId,
      barberProfileId,
      serviceId,
      date,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(bookingRepository.createDraft).toHaveBeenCalled();
    expect(result.status).toBe(BookingStatus.DRAFT);
  });

  it('lança SLOT_NOT_AVAILABLE quando o horário não está na lista', async () => {
    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        { serviceId, date, startTime: '14:00' },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);

    expect(bookingRepository.createDraft).not.toHaveBeenCalled();
  });

  it('lança NotFound quando o barbeiro não existe', async () => {
    barberProfileRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        { serviceId, date, startTime: '10:00' },
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
