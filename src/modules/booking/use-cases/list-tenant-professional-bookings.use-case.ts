import { Inject, Injectable } from '@nestjs/common';
import {
  ITenantProfessionalRepository,
  TENANT_PROFESSIONAL_REPOSITORY,
} from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../../availability/utils/assert-tenant-professional-agenda-access';
import { BookingStatus } from '../entities/booking-status.enum';
import { OpsBookingResponseDto } from '../dto/ops-booking-response.dto';
import { mapBookingToOpsResponse } from '../mappers/ops-booking.mapper';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { resolveDayRangeUtc } from '../utils/resolve-day-range';

export interface ListTenantProfessionalBookingsParams {
  tenantId: string;
  tenantProfessionalId: string;
  timezone: string;
  userId: string;
  callerRole?: string;
  date?: string;
  status?: BookingStatus;
}

@Injectable()
export class ListTenantProfessionalBookingsUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    params: ListTenantProfessionalBookingsParams,
  ): Promise<OpsBookingResponseDto[]> {
    await assertTenantProfessionalAgendaAccess({
      tenantId: params.tenantId,
      tenantProfessionalId: params.tenantProfessionalId,
      userId: params.userId,
      callerRole: params.callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });

    const range = params.date
      ? resolveDayRangeUtc(params.date, params.timezone)
      : undefined;

    const bookings = await this.bookingRepository.listOpsBookings({
      tenantId: params.tenantId,
      tenantProfessionalId: params.tenantProfessionalId,
      rangeStart: range?.rangeStart,
      rangeEnd: range?.rangeEnd,
      status: params.status,
    });

    return bookings.map((booking) =>
      mapBookingToOpsResponse(booking, params.timezone),
    );
  }
}
