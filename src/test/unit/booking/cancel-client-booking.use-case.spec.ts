import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CancelClientBookingUseCase } from 'src/modules/booking/use-cases/cancel-client-booking.use-case';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('CancelClientBookingUseCase', () => {
  let useCase: CancelClientBookingUseCase;
  let bookingRepository: {
    findByIdForTenantProfessional: jest.Mock;
    updateStatus: jest.Mock;
  };
  let findTenantByIdUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const clientUserId = 'client-uuid';
  const bookingId = 'booking-uuid';
  const startsAt = DateTime.utc().plus({ hours: 3 }).toJSDate();
  const endsAt = DateTime.utc().plus({ hours: 3, minutes: 30 }).toJSDate();

  const baseBooking: BookingEntity = {
    id: bookingId,
    tenantId,
    tenantProfessionalId,
    serviceId: 'svc',
    startsAt,
    endsAt,
    status: BookingStatus.DRAFT,
    clientUserId,
    createdByTenantUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BookingEntity;

  beforeEach(async () => {
    bookingRepository = {
      findByIdForTenantProfessional: jest.fn().mockResolvedValue(baseBooking),
      updateStatus: jest
        .fn()
        .mockImplementation((_id, _t, _tp, _from, to) =>
          Promise.resolve({ ...baseBooking, status: to }),
        ),
    };
    findTenantByIdUseCase = {
      run: jest.fn().mockResolvedValue({
        id: tenantId,
        clientCanCancelConfirmed: true,
        clientCancelConfirmedMinLeadMinutes: 60,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelClientBookingUseCase,
        { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
        { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
      ],
    }).compile();

    useCase = module.get(CancelClientBookingUseCase);
  });

  it('cancela DRAFT sem consultar settings do tenant', async () => {
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      clientUserId,
    );
    expect(findTenantByIdUseCase.run).not.toHaveBeenCalled();
    expect(bookingRepository.updateStatus).toHaveBeenCalledWith(
      bookingId,
      tenantId,
      tenantProfessionalId,
      BookingStatus.DRAFT,
      BookingStatus.CANCELLED,
    );
    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it('cancela CONFIRMED quando flag ligada e dentro da antecedência', async () => {
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue({
      ...baseBooking,
      status: BookingStatus.CONFIRMED,
    });
    const result = await useCase.run(
      tenantId,
      tenantProfessionalId,
      bookingId,
      clientUserId,
    );
    expect(findTenantByIdUseCase.run).toHaveBeenCalledWith(tenantId);
    expect(bookingRepository.updateStatus).toHaveBeenCalledWith(
      bookingId,
      tenantId,
      tenantProfessionalId,
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
    );
    expect(result.status).toBe(BookingStatus.CANCELLED);
  });

  it('bloqueia CONFIRMED quando flag desligada', async () => {
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue({
      ...baseBooking,
      status: BookingStatus.CONFIRMED,
    });
    findTenantByIdUseCase.run.mockResolvedValue({
      clientCanCancelConfirmed: false,
      clientCancelConfirmedMinLeadMinutes: 60,
    });
    try {
      await useCase.run(
        tenantId,
        tenantProfessionalId,
        bookingId,
        clientUserId,
      );
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(BusinessRuleException);
      expect((e as BusinessRuleException).getResponse()).toMatchObject({
        code: 'CLIENT_CANCEL_DISABLED',
      });
    }
    expect(bookingRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('bloqueia CONFIRMED quando falta antecedência', async () => {
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue({
      ...baseBooking,
      status: BookingStatus.CONFIRMED,
      startsAt: DateTime.utc().plus({ minutes: 30 }).toJSDate(),
      endsAt: DateTime.utc().plus({ minutes: 60 }).toJSDate(),
    });
    findTenantByIdUseCase.run.mockResolvedValue({
      clientCanCancelConfirmed: true,
      clientCancelConfirmedMinLeadMinutes: 60,
    });
    try {
      await useCase.run(
        tenantId,
        tenantProfessionalId,
        bookingId,
        clientUserId,
      );
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(BusinessRuleException);
      expect((e as BusinessRuleException).getResponse()).toMatchObject({
        code: 'CLIENT_CANCEL_TOO_LATE',
      });
    }
  });

  it('bloqueia quando não é o dono', async () => {
    await expect(
      useCase.run(tenantId, tenantProfessionalId, bookingId, 'other-user'),
    ).rejects.toBeInstanceOf(TenantForbiddenException);
  });

  it('lança NotFound quando booking não existe', async () => {
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue(null);
    await expect(
      useCase.run(tenantId, tenantProfessionalId, bookingId, clientUserId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança quando status é CANCELLED', async () => {
    bookingRepository.findByIdForTenantProfessional.mockResolvedValue({
      ...baseBooking,
      status: BookingStatus.CANCELLED,
    });
    await expect(
      useCase.run(tenantId, tenantProfessionalId, bookingId, clientUserId),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });
});
