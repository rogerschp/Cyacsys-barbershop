import { Injectable } from '@nestjs/common';
import { GetClientAvailableSlotsUseCase } from '../../availability/use-cases/get-client-available-slots.use-case';
import { CreateGuestBookingDraftDto } from '../dto/create-booking-draft.dto';
import { BookingEntity } from '../entities/booking.entity';
import { CustomerResolverService } from '../domain/customer-resolver.service';
import { CreateBookingDraftForCustomerUseCase } from './create-booking-draft-for-customer.use-case';

@Injectable()
export class CreateGuestBookingDraftUseCase {
  constructor(
    private readonly getClientAvailableSlotsUseCase: GetClientAvailableSlotsUseCase,
    private readonly customerResolver: CustomerResolverService,
    private readonly createBookingDraftForCustomer: CreateBookingDraftForCustomerUseCase,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    dto: CreateGuestBookingDraftDto,
  ): Promise<BookingEntity> {
    const identity = this.customerResolver.resolve({
      mode: 'guest',
      guestName: dto.guestName,
      guestPhone: dto.guestPhone,
      guestEmail: dto.guestEmail,
    });

    return this.createBookingDraftForCustomer.run({
      tenantId,
      tenantProfessionalId,
      dto,
      identity,
      createdByTenantUserId: null,
      loadAvailableSlots: () =>
        this.getClientAvailableSlotsUseCase.run(
          tenantId,
          tenantProfessionalId,
          dto.serviceId,
          dto.date,
        ),
    });
  }
}
