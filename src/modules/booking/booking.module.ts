import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingRepository } from '../../repository/booking/booking.repository';
import { AuthModule } from '../auth/auth.module';
import { AvailabilityModule } from '../availability/availability.module';
import { TenantProfessionalModule } from '../tenant-professional/tenant-professional.module';
import { ServiceModule } from '../service/service.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { BookingEntity } from './entities/booking.entity';
import { BOOKING_REPOSITORY } from './interfaces/booking-repository.interface';
import { BookingController } from './booking.controller';
import { UserBookingsController } from './user-bookings.controller';
import { CancelBookingDraftUseCase } from './use-cases/cancel-booking-draft.use-case';
import { ConfirmBookingUseCase } from './use-cases/confirm-booking.use-case';
import { CreateBookingDraftUseCase } from './use-cases/create-booking-draft.use-case';
import { ListMyBookingsUseCase } from './use-cases/list-my-bookings.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
    forwardRef(() => TenantProfessionalModule),
    forwardRef(() => ServiceModule),
    forwardRef(() => AvailabilityModule),
  ],
  controllers: [BookingController, UserBookingsController],
  providers: [
    BookingRepository,
    { provide: BOOKING_REPOSITORY, useClass: BookingRepository },
    CreateBookingDraftUseCase,
    ConfirmBookingUseCase,
    CancelBookingDraftUseCase,
    ListMyBookingsUseCase,
  ],
  exports: [BOOKING_REPOSITORY, ListMyBookingsUseCase],
})
export class BookingModule {}
