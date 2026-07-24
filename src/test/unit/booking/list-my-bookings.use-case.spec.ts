import { Test, TestingModule } from '@nestjs/testing';
import { ListMyBookingsUseCase } from 'src/modules/booking/use-cases/list-my-bookings.use-case';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from 'src/modules/booking/interfaces/booking-repository.interface';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('ListMyBookingsUseCase', () => {
  let useCase: ListMyBookingsUseCase;
  let bookingRepository: jest.Mocked<
    Pick<IBookingRepository, 'findByClientUserId'>
  >;

  beforeEach(async () => {
    bookingRepository = {
      findByClientUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListMyBookingsUseCase,
        { provide: BOOKING_REPOSITORY, useValue: bookingRepository },
      ],
    }).compile();

    useCase = module.get(ListMyBookingsUseCase);
  });

  it('mapeia agendamentos com tenant, profissional e horário local', async () => {
    const startsAt = new Date('2026-04-06T17:00:00.000Z');
    const endsAt = new Date('2026-04-06T17:30:00.000Z');
    bookingRepository.findByClientUserId.mockResolvedValue([
      {
        id: 'booking-1',
        tenantId: 'tenant-1',
        tenantProfessionalId: 'tp-1',
        serviceId: 'svc-1',
        status: BookingStatus.CONFIRMED,
        startsAt,
        endsAt,
        tenant: {
          id: 'tenant-1',
          name: 'Barbearia do Vitinho',
          slug: 'barbearia-do-vitinho',
          telephone: '5511992834085',
          timezone: 'America/Sao_Paulo',
          address: {
            street: 'Rua A',
            number: '1',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000',
            country: 'Brazil',
          },
        },
        tenantProfessional: {
          professionalProfile: {
            id: 'pp-1',
            userId: 'pro-user',
            displayName: 'João Pro',
          },
        },
        service: { name: 'Corte', durationInMinutes: 30 },
      } as BookingEntity,
    ]);

    const result = await useCase.run({ userId: 'user-uuid' });

    expect(bookingRepository.findByClientUserId).toHaveBeenCalledWith(
      'user-uuid',
      { status: undefined, rangeStart: undefined, rangeEnd: undefined },
    );
    expect(result[0].tenant.name).toBe('Barbearia do Vitinho');
    expect(result[0].tenant.address?.city).toBe('São Paulo');
    expect(result[0].professional.displayName).toBe('João Pro');
    expect(result[0].date).toBe('2026-04-06');
    expect(result[0].startTime).toBe('14:00');
    expect(result[0].endTime).toBe('14:30');
  });

  it('aplica filtro from/to no fuso informado', async () => {
    bookingRepository.findByClientUserId.mockResolvedValue([]);

    await useCase.run({
      userId: 'user-uuid',
      from: '2026-04-01',
      to: '2026-04-07',
      timezone: 'America/Sao_Paulo',
      status: BookingStatus.COMPLETED,
    });

    expect(bookingRepository.findByClientUserId).toHaveBeenCalledWith(
      'user-uuid',
      expect.objectContaining({
        status: BookingStatus.COMPLETED,
        rangeStart: expect.any(Date),
        rangeEnd: expect.any(Date),
      }),
    );
  });

  it('rejeita date junto com from/to', async () => {
    await expect(
      useCase.run({
        userId: 'user-uuid',
        date: '2026-04-01',
        from: '2026-04-01',
        to: '2026-04-07',
      }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });
});
