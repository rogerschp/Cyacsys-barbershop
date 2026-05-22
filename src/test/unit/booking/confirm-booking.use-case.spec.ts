import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { ConfirmBookingUseCase } from 'src/modules/booking/use-cases/confirm-booking.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('ConfirmBookingUseCase', () => {
  let useCase: ConfirmBookingUseCase;
  let bookingRepository: {
    findByIdForTenantProfessional: jest.Mock;
    updateStatus: jest.Mock;
  };
  let tenantProfessionalRepository: { findById: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const userId = 'user-uuid';
  const bookingId = 'booking-uuid';
  const futureStart = new Date(Date.now() + 86400000);
  const draftBooking: BookingEntity = {
    id: bookingId,
    tenantId,
    tenantProfessionalId,
    serviceId: 'svc',
    startsAt: futureStart,
    endsAt: new Date(futureStart.getTime() + 30 * 60000),
    status: BookingStatus.DRAFT,
    createdByTenantUserId: 'tu',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BookingEntity;

  beforeEach(async () => {
    bookingRepository = {
      findByIdForTenantProfessional: jest.fn().mockResolvedValue(draftBooking),
      updateStatus: jest.fn().mockResolvedValue({
        ...draftBooking,
        status: BookingStatus.CONFIRMED,
      }),
    };
    tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue({ id: tenantProfessionalId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmBookingUseCase,
        { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepository,
        },
      ],
    }).compile();

    useCase = module.get(ConfirmBookingUseCase);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('confirma rascunho válido', async () => {
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      userId,
      TenantUserRole.ADMIN,
    );
    expect(bookingRepository.updateStatus).toHaveBeenCalledWith(
      bookingId,
      tenantId,
      tenantProfessionalId,
      BookingStatus.DRAFT,
      BookingStatus.CONFIRMED,
    );
    expect(result.status).toBe(BookingStatus.CONFIRMED);
  });

  it('lança quando o booking não existe', async () => {
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue(null);
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        bookingId,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('lança quando não é rascunho', async () => {
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue({
      ...draftBooking,
      status: BookingStatus.CONFIRMED,
    });
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        bookingId,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });

  it('lança BOOKING_IN_THE_PAST quando o início já passou', async () => {
    const pastStart = new Date(Date.now() - 3600000);
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue({
      ...draftBooking,
      startsAt: pastStart,
      endsAt: new Date(pastStart.getTime() + 30 * 60000),
    });
    jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.utc() as any);
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        bookingId,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });

  it('propaga SLOT_NOT_AVAILABLE quando updateStatus sinaliza conflito', async () => {
    bookingRepository.updateStatus.mockRejectedValue(
      new Error('BOOKING_SLOT_CONFLICT'),
    );
    await expect(
      useCase.run(
        tenantId,
        tenantProfessionalId,
        bookingId,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
});
