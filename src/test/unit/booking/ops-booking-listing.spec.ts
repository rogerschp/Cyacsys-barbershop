import { mapBookingToOpsResponse } from 'src/modules/booking/mappers/ops-booking.mapper';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { BookingEntity } from 'src/modules/booking/entities/booking.entity';
import { resolveDayRangeUtc } from 'src/modules/booking/utils/resolve-day-range';
import { resolveOpsDateFilter } from 'src/modules/booking/domain/resolve-ops-date-filter';
import { ListTenantProfessionalBookingsUseCase } from 'src/modules/booking/use-cases/list-tenant-professional-bookings.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('ops booking listing', () => {
  describe('mapBookingToOpsResponse', () => {
    const base = {
      id: 'b1',
      tenantId: 't1',
      tenantProfessionalId: 'tp1',
      serviceId: 's1',
      startsAt: new Date('2026-04-06T13:00:00.000Z'),
      endsAt: new Date('2026-04-06T13:30:00.000Z'),
      status: BookingStatus.CONFIRMED,
      service: { name: 'Corte', durationInMinutes: 30 },
      tenantProfessional: {
        professionalProfileId: 'pp1',
        professionalProfile: {
          id: 'pp1',
          userId: 'pro-user',
          displayName: 'João',
        },
      },
    } as unknown as BookingEntity;

    it('mapeia booking de usuário autenticado', () => {
      const dto = mapBookingToOpsResponse(
        { ...base, clientUserId: 'u1' } as BookingEntity,
        'America/Sao_Paulo',
      );
      expect(dto.customer.kind).toBe('USER');
      expect(dto.customer.clientUserId).toBe('u1');
      expect(dto.date).toBe('2026-04-06');
      expect(dto.startTime).toBe('10:00');
      expect(dto.endTime).toBe('10:30');
      expect(dto.professional.displayName).toBe('João');
      expect(dto.service.name).toBe('Corte');
    });

    it('mapeia booking de guest', () => {
      const dto = mapBookingToOpsResponse(
        {
          ...base,
          clientUserId: null,
          guestName: 'Maria',
          guestPhone: '5511999999999',
        } as BookingEntity,
        'America/Sao_Paulo',
      );
      expect(dto.customer.kind).toBe('GUEST');
      expect(dto.customer.guestName).toBe('Maria');
      expect(dto.customer.guestPhone).toBe('5511999999999');
      expect(dto.customer.clientUserId).toBeNull();
    });
  });

  describe('resolveDayRangeUtc', () => {
    it('converte data local do tenant em intervalo UTC de um dia', () => {
      const { rangeStart, rangeEnd } = resolveDayRangeUtc(
        '2026-04-06',
        'America/Sao_Paulo',
      );
      expect(rangeStart.toISOString()).toBe('2026-04-06T03:00:00.000Z');
      expect(rangeEnd.toISOString()).toBe('2026-04-07T03:00:00.000Z');
    });

    it('lança para data inválida', () => {
      expect(() =>
        resolveDayRangeUtc('not-a-date', 'America/Sao_Paulo'),
      ).toThrow(/Data inválida/);
    });
  });

  describe('resolveOpsDateFilter', () => {
    it('retorna undefined sem filtros', () => {
      expect(resolveOpsDateFilter({}, 'America/Sao_Paulo')).toBeUndefined();
    });

    it('aceita date diário', () => {
      const range = resolveOpsDateFilter(
        { date: '2026-07-20' },
        'America/Sao_Paulo',
      );
      expect(range?.rangeStart.toISOString()).toBe('2026-07-20T03:00:00.000Z');
      expect(range?.rangeEnd.toISOString()).toBe('2026-07-21T03:00:00.000Z');
    });

    it('aceita from/to semanal', () => {
      const range = resolveOpsDateFilter(
        { from: '2026-07-20', to: '2026-07-26' },
        'America/Sao_Paulo',
      );
      expect(range?.rangeStart.toISOString()).toBe('2026-07-20T03:00:00.000Z');
      expect(range?.rangeEnd.toISOString()).toBe('2026-07-27T03:00:00.000Z');
    });

    it('rejeita date junto com from/to', () => {
      try {
        resolveOpsDateFilter(
          { date: '2026-07-20', from: '2026-07-20', to: '2026-07-26' },
          'America/Sao_Paulo',
        );
        fail('expected throw');
      } catch (e) {
        expect((e as BusinessRuleException).getResponse()).toMatchObject({
          code: 'BOOKING_INVALID_DATE_FILTER',
        });
      }
    });

    it('rejeita from sem to', () => {
      try {
        resolveOpsDateFilter({ from: '2026-07-20' }, 'America/Sao_Paulo');
        fail('expected throw');
      } catch (e) {
        expect((e as BusinessRuleException).getResponse()).toMatchObject({
          code: 'BOOKING_INVALID_DATE_FILTER',
        });
      }
    });

    it('rejeita from > to', () => {
      try {
        resolveOpsDateFilter(
          { from: '2026-07-26', to: '2026-07-20' },
          'America/Sao_Paulo',
        );
        fail('expected throw');
      } catch (e) {
        expect((e as BusinessRuleException).getResponse()).toMatchObject({
          code: 'BOOKING_INVALID_DATE_FILTER',
        });
      }
    });

    it('rejeita intervalo maior que 31 dias', () => {
      try {
        resolveOpsDateFilter(
          { from: '2026-07-01', to: '2026-08-05' },
          'America/Sao_Paulo',
        );
        fail('expected throw');
      } catch (e) {
        expect((e as BusinessRuleException).getResponse()).toMatchObject({
          code: 'BOOKING_DATE_RANGE_TOO_LARGE',
        });
      }
    });
  });

  describe('ListTenantProfessionalBookingsUseCase', () => {
    it('valida acesso à agenda e filtra por dia/status', async () => {
      const bookingRepository = {
        listOpsBookings: jest.fn().mockResolvedValue([]),
      };
      const tenantProfessionalRepository = {
        findById: jest.fn().mockResolvedValue({
          id: 'tp1',
          professionalProfile: { userId: 'u1' },
        }),
      };
      const useCase = new ListTenantProfessionalBookingsUseCase(
        bookingRepository as any,
        tenantProfessionalRepository as any,
      );

      await useCase.run({
        tenantId: 't1',
        tenantProfessionalId: 'tp1',
        timezone: 'America/Sao_Paulo',
        userId: 'u1',
        callerRole: 'OWNER',
        date: '2026-04-06',
        status: BookingStatus.CONFIRMED,
      });

      expect(bookingRepository.listOpsBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 't1',
          tenantProfessionalId: 'tp1',
          status: BookingStatus.CONFIRMED,
          rangeStart: expect.any(Date),
          rangeEnd: expect.any(Date),
        }),
      );
    });

    it('filtra por from/to', async () => {
      const bookingRepository = {
        listOpsBookings: jest.fn().mockResolvedValue([]),
      };
      const tenantProfessionalRepository = {
        findById: jest.fn().mockResolvedValue({
          id: 'tp1',
          professionalProfile: { userId: 'u1' },
        }),
      };
      const useCase = new ListTenantProfessionalBookingsUseCase(
        bookingRepository as any,
        tenantProfessionalRepository as any,
      );

      await useCase.run({
        tenantId: 't1',
        tenantProfessionalId: 'tp1',
        timezone: 'America/Sao_Paulo',
        userId: 'u1',
        callerRole: 'OWNER',
        from: '2026-07-20',
        to: '2026-07-26',
      });

      expect(bookingRepository.listOpsBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          rangeStart: new Date('2026-07-20T03:00:00.000Z'),
          rangeEnd: new Date('2026-07-27T03:00:00.000Z'),
        }),
      );
    });
  });
});
