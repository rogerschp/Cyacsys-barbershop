import { Inject, Injectable } from '@nestjs/common';
import { BookingStatus } from '../entities/booking-status.enum';
import { MyBookingResponseDto } from '../dto/my-booking-response.dto';
import { mapBookingToMyBookingResponse } from '../mappers/my-booking.mapper';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';

@Injectable()
export class ListMyBookingsUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async run(
    userId: string,
    status?: BookingStatus,
  ): Promise<MyBookingResponseDto[]> {
    const bookings = await this.bookingRepository.findByClientUserId(userId, {
      status,
    });
    return bookings.map(mapBookingToMyBookingResponse);
  }
}
