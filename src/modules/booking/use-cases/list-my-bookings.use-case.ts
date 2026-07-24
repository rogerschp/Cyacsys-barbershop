import { Inject, Injectable } from '@nestjs/common';
import { BookingStatus } from '../entities/booking-status.enum';
import { MyBookingResponseDto } from '../dto/my-booking-response.dto';
import { mapBookingToMyBookingResponse } from '../mappers/my-booking.mapper';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { resolveOpsDateFilter } from '../domain/resolve-ops-date-filter';

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export interface ListMyBookingsParams {
  userId: string;
  status?: BookingStatus;
  date?: string;
  from?: string;
  to?: string;
  /** Fuso para interpretar date/from/to (meus bookings podem cruzar tenants). */
  timezone?: string;
}

@Injectable()
export class ListMyBookingsUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async run(params: ListMyBookingsParams): Promise<MyBookingResponseDto[]> {
    const timezone = params.timezone?.trim() || DEFAULT_TIMEZONE;
    const range = resolveOpsDateFilter(
      { date: params.date, from: params.from, to: params.to },
      timezone,
    );

    const bookings = await this.bookingRepository.findByClientUserId(
      params.userId,
      {
        status: params.status,
        rangeStart: range?.rangeStart,
        rangeEnd: range?.rangeEnd,
      },
    );
    return bookings.map(mapBookingToMyBookingResponse);
  }
}
