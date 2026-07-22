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
import { ClientBookingController } from './controllers/client-booking.controller';
import { GuestBookingController } from './controllers/guest-booking.controller';
import { UserBookingsController } from './user-bookings.controller';
import { AssertCustomerBookingPolicies } from './domain/assert-customer-booking-policies';
import { CustomerResolverService } from './domain/customer-resolver.service';
import { CancelBookingDraftUseCase } from './use-cases/cancel-booking-draft.use-case';
import { CancelClientBookingUseCase } from './use-cases/cancel-client-booking.use-case';
import { ConfirmBookingUseCase } from './use-cases/confirm-booking.use-case';
import { ConfirmClientBookingUseCase } from './use-cases/confirm-client-booking.use-case';
import { CreateBookingDraftForCustomerUseCase } from './use-cases/create-booking-draft-for-customer.use-case';
import { CreateBookingDraftUseCase } from './use-cases/create-booking-draft.use-case';
import { CreateClientBookingDraftUseCase } from './use-cases/create-client-booking-draft.use-case';
import { CreateGuestBookingDraftUseCase } from './use-cases/create-guest-booking-draft.use-case';
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
  controllers: [
    BookingController,
    ClientBookingController,
    GuestBookingController,
    UserBookingsController,
  ],
  providers: [
    BookingRepository,
    { provide: BOOKING_REPOSITORY, useClass: BookingRepository },
    CustomerResolverService,
    AssertCustomerBookingPolicies,
    CreateBookingDraftForCustomerUseCase,
    CreateBookingDraftUseCase,
    ConfirmBookingUseCase,
    CancelBookingDraftUseCase,
    CreateClientBookingDraftUseCase,
    CreateGuestBookingDraftUseCase,
    ConfirmClientBookingUseCase,
    CancelClientBookingUseCase,
    ListMyBookingsUseCase,
  ],
  exports: [BOOKING_REPOSITORY, ListMyBookingsUseCase, CustomerResolverService],
})
export class BookingModule {}
