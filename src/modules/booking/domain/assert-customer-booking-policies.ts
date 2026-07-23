import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { MAX_ACTIVE_BOOKINGS_PER_CUSTOMER_PER_TENANT } from '../booking-active-limit.constants';
import { CustomerIdentity } from '../domain/customer-identity';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';

@Injectable()
export class AssertCustomerBookingPolicies {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async assertCanCreate(params: {
    tenantId: string;
    identity: CustomerIdentity;
    startsAt: Date;
    endsAt: Date;
    excludeBookingId?: string;
  }): Promise<void> {
    const { tenantId, identity, startsAt, endsAt, excludeBookingId } = params;

    const overlap = await this.bookingRepository.findActiveCustomerTimeOverlap({
      tenantId,
      identity,
      startsAt,
      endsAt,
      excludeBookingId,
    });
    if (overlap) {
      throw new BusinessRuleException(
        'CUSTOMER_TIME_CONFLICT',
        'Esta pessoa já possui um agendamento ativo que conflita com este horário.',
      );
    }

    const activeCount =
      await this.bookingRepository.countActiveByCustomerIdentity({
        tenantId,
        identity,
        excludeBookingId,
      });
    if (activeCount >= MAX_ACTIVE_BOOKINGS_PER_CUSTOMER_PER_TENANT) {
      throw new BusinessRuleException(
        'CUSTOMER_ACTIVE_BOOKINGS_LIMIT',
        `Limite de ${MAX_ACTIVE_BOOKINGS_PER_CUSTOMER_PER_TENANT} agendamentos ativos atingido neste estabelecimento.`,
      );
    }
  }
}
