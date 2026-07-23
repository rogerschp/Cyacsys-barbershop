import { CompleteBookingUseCase } from 'src/modules/booking/use-cases/complete-booking.use-case';
import { CompletePastBookingsUseCase } from 'src/modules/booking/use-cases/complete-past-bookings.use-case';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('Complete booking', () => {
  it('completa booking CONFIRMED', async () => {
    const bookingRepository = {
      findByIdForTenantProfessional: jest.fn().mockResolvedValue({
        id: 'b1',
        status: BookingStatus.CONFIRMED,
      }),
      updateStatus: jest.fn().mockResolvedValue({
        id: 'b1',
        status: BookingStatus.COMPLETED,
      }),
    };
    const tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'tp1',
        professionalProfile: { userId: 'u1' },
      }),
    };
    const useCase = new CompleteBookingUseCase(
      bookingRepository as any,
      tenantProfessionalRepository as any,
    );

    const result = await useCase.run('t1', 'tp1', 'b1', 'u1', 'OWNER');
    expect(result.status).toBe(BookingStatus.COMPLETED);
    expect(bookingRepository.updateStatus).toHaveBeenCalledWith(
      'b1',
      't1',
      'tp1',
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
    );
  });

  it('rejeita se não for CONFIRMED', async () => {
    const bookingRepository = {
      findByIdForTenantProfessional: jest.fn().mockResolvedValue({
        id: 'b1',
        status: BookingStatus.DRAFT,
      }),
    };
    const tenantProfessionalRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'tp1',
        professionalProfile: { userId: 'u1' },
      }),
    };
    const useCase = new CompleteBookingUseCase(
      bookingRepository as any,
      tenantProfessionalRepository as any,
    );

    await expect(
      useCase.run('t1', 'tp1', 'b1', 'u1', 'OWNER'),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('job completa bookings passados', async () => {
    const bookingRepository = {
      completePastConfirmed: jest.fn().mockResolvedValue(3),
    };
    const useCase = new CompletePastBookingsUseCase(bookingRepository as any);
    await expect(useCase.run()).resolves.toBe(3);
  });
});
