import { Injectable, Inject } from '@nestjs/common';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from '../../tenant-user/use-cases/validate-membership-by-userId-and-tenantId.use-case';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { GetAvailableSlotsUseCase } from '../../availability/use-cases/get-available-slots.use-case';
import { assertTenantProfessionalAgendaAccess } from '../../availability/utils/assert-tenant-professional-agenda-access';
import { CreateOpsBookingDraftDto } from '../dto/create-booking-draft.dto';
import { BookingEntity } from '../entities/booking.entity';
import { CustomerResolverService } from '../domain/customer-resolver.service';
import { CreateBookingDraftForCustomerUseCase } from './create-booking-draft-for-customer.use-case';

@Injectable()
export class CreateBookingDraftUseCase {
  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
    private readonly validateMembershipByUserIdAndTenantIdUseCase: ValidateMembershipByUserIdAndTenantIdUseCase,
    private readonly getAvailableSlotsUseCase: GetAvailableSlotsUseCase,
    private readonly customerResolver: CustomerResolverService,
    private readonly createBookingDraftForCustomer: CreateBookingDraftForCustomerUseCase,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    dto: CreateOpsBookingDraftDto,
    userId: string,
    callerRole?: string,
  ): Promise<BookingEntity> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });

    const membership =
      await this.validateMembershipByUserIdAndTenantIdUseCase.run(
        userId,
        tenantId,
      );

    const identity = this.customerResolver.resolve({
      mode: 'ops',
      authenticatedUserId: userId,
      clientUserId: dto.clientUserId,
      guestName: dto.guestName,
      guestPhone: dto.guestPhone,
      guestEmail: dto.guestEmail,
    });

    return this.createBookingDraftForCustomer.run({
      tenantId,
      tenantProfessionalId,
      dto,
      identity,
      createdByTenantUserId: membership.id,
      loadAvailableSlots: () =>
        this.getAvailableSlotsUseCase.run(
          tenantId,
          tenantProfessionalId,
          dto.serviceId,
          dto.date,
          userId,
          callerRole,
        ),
    });
  }
}
