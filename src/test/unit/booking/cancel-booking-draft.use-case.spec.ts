import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CancelBookingDraftUseCase } from 'src/modules/booking/use-cases/cancel-booking-draft.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('CancelBookingDraftUseCase', () => {
  let useCase: CancelBookingDraftUseCase;
  let bookingRepository: {
    findByIdForBarber: jest.Mock;
    updateStatus: jest.Mock;
  };
  let barberProfileRepository: { findById: jest.Mock };
  let tenantUserService: { getByIdAndTenant: jest.Mock };

  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const userId = 'user-uuid';
  const bookingId = 'booking-uuid';
  const draftBooking: BookingEntity = {
    id: bookingId,
    tenantId,
    barberProfileId,
    serviceId: 'svc',
    startsAt: new Date(Date.now() + 86400000),
    endsAt: new Date(Date.now() + 86400000 + 30 * 60000),
    status: BookingStatus.DRAFT,
    createdByTenantUserId: 'tu',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BookingEntity;

  beforeEach(async () => {
    bookingRepository = {
      findByIdForBarber: jest.fn().mockResolvedValue(draftBooking),
      updateStatus: jest.fn().mockResolvedValue({
        ...draftBooking,
        status: BookingStatus.CANCELLED,
      }),
    };
    barberProfileRepository = {
      findById: jest.fn().mockResolvedValue({ id: barberProfileId }),
    };
    tenantUserService = {
      getByIdAndTenant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelBookingDraftUseCase,
        { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
        {
          provide: BARBER_PROFILE_REPOSITORY,
          useValue: barberProfileRepository,
        },
        { provide: TenantUserService, useValue: tenantUserService },
      ],
    }).compile();

    useCase = module.get(CancelBookingDraftUseCase);
  });

  it('cancela rascunho e retorna CANCELLED', async () => {
    const result = await useCase.run(
      tenantId,
      barberProfileId,
      bookingId,
      userId,
      TenantUserRole.ADMIN,
    );

    expect(bookingRepository.updateStatus).toHaveBeenCalledWith(
      bookingId,
      tenantId,
      barberProfileId,
      BookingStatus.DRAFT,
      BookingStatus.CANCELLED,
    );
    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it('lança NotFound quando booking não existe', async () => {
    bookingRepository.findByIdForBarber.mockResolvedValue(null);
    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        bookingId,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('lança quando não é rascunho', async () => {
    bookingRepository.findByIdForBarber.mockResolvedValue({
      ...draftBooking,
      status: BookingStatus.CONFIRMED,
    });
    await expect(
      useCase.run(
        tenantId,
        barberProfileId,
        bookingId,
        userId,
        TenantUserRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessRuleException);
  });
});
