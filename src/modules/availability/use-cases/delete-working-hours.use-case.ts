import { Inject, Injectable } from '@nestjs/common';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { ensureWorkingHoursForBarber } from '../utils/ensure-working-hours-for-barber';
@Injectable()
export class DeleteWorkingHoursUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase) { }
    async run(tenantId: string, barberProfileId: string, workingHoursId: string, userId: string, callerRole?: string): Promise<void> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
        });
        await ensureWorkingHoursForBarber(this.availabilityRepository, workingHoursId, barberProfileId, tenantId, false);
        await this.availabilityRepository.softDeleteWorkingHours(workingHoursId, tenantId);
    }
}
