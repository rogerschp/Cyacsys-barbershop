import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CancelBookingDraftUseCase } from 'src/modules/booking/use-cases/cancel-booking-draft.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('CancelBookingDraftUseCase', () => {
  let useCase: CancelBookingDraftUseCase;
  let bookingRepository: {
    findByIdForTenantProfessional: jest.Mock;
    updateStatus: jest.Mock;
  };
  let tenantProfessionalRepository: { findById: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const userId = 'user-uuid';
  const bookingId = 'booking-uuid';
  const draftBooking: BookingEntity = {
    id: bookingId,
    tenantId,
    tenantProfessionalId,
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
      findByIdForTenantProfessional: jest.fn().mockResolvedValue(draftBooking),
      updateStatus: jest.fn().mockResolvedValue({
        ...draftBooking,
        status: BookingStatus.CANCELLED,
      }),
    };
    tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue({ id: tenantProfessionalId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelBookingDraftUseCase,
        { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepository,
        },
      ],
    }).compile();

    useCase = module.get(CancelBookingDraftUseCase);
  });

  it('cancela rascunho e retorna CANCELLED', async () => {
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
      BookingStatus.CANCELLED,
    );
    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it('lança NotFound quando booking não existe', async () => {
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
    expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
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
});
