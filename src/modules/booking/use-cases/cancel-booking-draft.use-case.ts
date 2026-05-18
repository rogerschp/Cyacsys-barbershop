import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';
import { BOOKING_REPOSITORY, IBookingRepository, } from '../interfaces/booking-repository.interface';
import { assertBarberAgendaAccess } from '../../availability/utils/assert-barber-agenda-access';
@Injectable()
export class CancelBookingDraftUseCase {
    constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase) { }
    async run(tenantId: string, barberProfileId: string, bookingId: string, userId: string, callerRole?: string): Promise<BookingEntity> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
        });
        const booking = await this.bookingRepository.findByIdForBarber(bookingId, tenantId, barberProfileId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }
        if (booking.status !== BookingStatus.DRAFT) {
            throw new BusinessRuleException('BOOKING_INVALID_STATUS', 'Só é possível cancelar um rascunho.');
        }
        try {
            return await this.bookingRepository.updateStatus(bookingId, tenantId, barberProfileId, BookingStatus.DRAFT, BookingStatus.CANCELLED);
        }
        catch (e: unknown) {
            if (e instanceof Error && e.message === 'BOOKING_INVALID_STATUS') {
                throw new BusinessRuleException('BOOKING_INVALID_STATUS', 'Só é possível cancelar um rascunho.');
            }
            if (e instanceof Error && e.message === 'BOOKING_NOT_FOUND') {
                throw new NotFoundException('Booking not found');
            }
            throw e;
        }
    }
}
