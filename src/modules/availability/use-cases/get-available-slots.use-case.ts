import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../../service/interfaces/service-repository.interface';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { AvailableSlotsResponseDto } from '../dto/available-slots-response.dto';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { assertActiveTenantProfessional } from '../utils/assert-active-tenant-professional';
import { dayOfWeekForTenantDate } from '../utils/day-of-week-from-date';
import {
  hmToMinutes,
  minutesToHm,
  rangesOverlapHalfOpen,
} from '../utils/time-range.utils';
import { BOOKING_MIN_LEAD_MINUTES } from '../../booking/booking-lead.constants';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../../booking/interfaces/booking-repository.interface';

@Injectable()
export class GetAvailableSlotsUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    serviceId: string,
    dateYmd: string,
    userId: string,
    callerRole?: string,
  ): Promise<AvailableSlotsResponseDto> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });
    await assertActiveTenantProfessional(
      this.tenantProfessionalRepository,
      tenantProfessionalId,
      tenantId,
    );

    const tenant = await this.findTenantByIdUseCase.run(tenantId);
    const timezone = tenant.timezone || 'America/Sao_Paulo';
    const dow = dayOfWeekForTenantDate(dateYmd, timezone);

    const service = await this.serviceRepository.findById(serviceId, tenantId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (!service.isActive) {
      throw new BusinessRuleException(
        'SERVICE_INACTIVE',
        'Serviço inativo não pode ser agendado.',
      );
    }

    const link =
      await this.availabilityRepository.findProfessionalServiceLinkByProfessionalAndService(
        tenantProfessionalId,
        tenantId,
        serviceId,
      );
    if (!link || !link.isActive) {
      throw new BusinessRuleException(
        'PROFESSIONAL_SERVICE_NOT_OFFERED',
        'O profissional não oferece este serviço.',
      );
    }

    const wh =
      await this.availabilityRepository.findWorkingHoursByProfessionalAndDay(
        tenantProfessionalId,
        tenantId,
        dow,
        true,
      );
    if (!wh || !wh.isActive) {
      return { date: dateYmd, timezone, slots: [] };
    }

    const periods = wh.periods ?? [];
    if (!periods.length) {
      return { date: dateYmd, timezone, slots: [] };
    }

    const timeOffs = await this.availabilityRepository.listTimeOffsOnDate(
      tenantProfessionalId,
      tenantId,
      dateYmd,
    );
    const partialTimeOffRanges: { s: number; e: number }[] = [];
    for (const t of timeOffs) {
      if (t.startTime == null && t.endTime == null) {
        return { date: dateYmd, timezone, slots: [] };
      }
      if (t.startTime != null && t.endTime != null) {
        partialTimeOffRanges.push({
          s: hmToMinutes(t.startTime),
          e: hmToMinutes(t.endTime),
        });
      }
    }

    const blocks = await this.availabilityRepository.listBlocksOnDate(
      tenantProfessionalId,
      tenantId,
      dateYmd,
    );
    const blockRanges = blocks.map((b) => ({
      s: hmToMinutes(b.startTime),
      e: hmToMinutes(b.endTime),
    }));

    const duration = service.durationInMinutes;
    const slotSet = new Set<string>();
    const nowUtc = DateTime.now().toUTC();
    const earliestBookableUtc = nowUtc.plus({
      minutes: BOOKING_MIN_LEAD_MINUTES,
    });

    const dayStartUtc = DateTime.fromFormat(dateYmd, 'yyyy-MM-dd', {
      zone: timezone,
    })
      .startOf('day')
      .toUTC();
    const dayEndUtc = DateTime.fromFormat(dateYmd, 'yyyy-MM-dd', {
      zone: timezone,
    })
      .endOf('day')
      .toUTC();

    const activeBookings =
      await this.bookingRepository.findActiveByTenantProfessionalBetween(
        tenantId,
        tenantProfessionalId,
        dayStartUtc.toJSDate(),
        dayEndUtc.toJSDate(),
      );

    for (const period of periods) {
      const ps = hmToMinutes(period.startTime);
      const pe = hmToMinutes(period.endTime);
      let t = ps;
      while (t + duration <= pe) {
        const hm = minutesToHm(t);
        let overlapsOff = false;
        for (const r of partialTimeOffRanges) {
          if (rangesOverlapHalfOpen(t, t + duration, r.s, r.e)) {
            overlapsOff = true;
            break;
          }
        }
        if (overlapsOff) {
          t += duration;
          continue;
        }
        let overlapsBlock = false;
        for (const r of blockRanges) {
          if (rangesOverlapHalfOpen(t, t + duration, r.s, r.e)) {
            overlapsBlock = true;
            break;
          }
        }
        if (overlapsBlock) {
          t += duration;
          continue;
        }
        const slotStartUtc = DateTime.fromFormat(
          `${dateYmd} ${hm}`,
          'yyyy-MM-dd HH:mm',
          { zone: timezone },
        ).toUTC();
        if (!slotStartUtc.isValid || slotStartUtc < earliestBookableUtc) {
          t += duration;
          continue;
        }

        const slotEndUtc = slotStartUtc.plus({ minutes: duration });
        const overlapsBooking = activeBookings.some(
          (booking) =>
            booking.startsAt < slotEndUtc.toJSDate() &&
            booking.endsAt > slotStartUtc.toJSDate(),
        );
        if (overlapsBooking) {
          t += duration;
          continue;
        }

        slotSet.add(hm);
        t += duration;
      }
    }

    const slots = [...slotSet].sort();
    return { date: dateYmd, timezone, slots };
  }
}
