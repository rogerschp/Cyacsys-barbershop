import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';

@Injectable()
export class CompletePastBookingsUseCase {
  private readonly logger = new Logger(CompletePastBookingsUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async run(): Promise<number> {
    const affected = await this.bookingRepository.completePastConfirmed(
      new Date(),
    );
    if (affected > 0) {
      this.logger.log({
        event: 'bookings_auto_completed',
        count: affected,
        timestamp: new Date().toISOString(),
      });
    }
    return affected;
  }
}
