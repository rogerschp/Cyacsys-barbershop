import { Inject, Injectable } from '@nestjs/common';
import { BookingStatus } from '../entities/booking-status.enum';
import { OpsBookingResponseDto } from '../dto/ops-booking-response.dto';
import { mapBookingToOpsResponse } from '../mappers/ops-booking.mapper';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { resolveOpsDateFilter } from '../domain/resolve-ops-date-filter';

export interface ListTenantBookingsParams {
  tenantId: string;
  timezone: string;
  date?: string;
  from?: string;
  to?: string;
  status?: BookingStatus;
}

@Injectable()
export class ListTenantBookingsUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async run(
    params: ListTenantBookingsParams,
  ): Promise<OpsBookingResponseDto[]> {
    const range = resolveOpsDateFilter(
      { date: params.date, from: params.from, to: params.to },
      params.timezone,
    );

    const bookings = await this.bookingRepository.listOpsBookings({
      tenantId: params.tenantId,
      rangeStart: range?.rangeStart,
      rangeEnd: range?.rangeEnd,
      status: params.status,
    });

    return bookings.map((booking) =>
      mapBookingToOpsResponse(booking, params.timezone),
    );
  }
}
