import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { ensureWorkingHoursForBarber } from '../utils/ensure-working-hours-for-barber';
@Injectable()
export class DeleteWorkingHoursPeriodUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase) { }
    async run(tenantId: string, barberProfileId: string, workingHoursId: string, periodId: string, userId: string, callerRole?: string): Promise<void> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
        });
        const wh = await ensureWorkingHoursForBarber(this.availabilityRepository, workingHoursId, barberProfileId, tenantId, false);
        const period = await this.availabilityRepository.findWorkingHoursPeriodById(periodId, tenantId);
        if (!period || period.workingHoursId !== workingHoursId) {
            throw new NotFoundException('Working hours period not found');
        }
        const countBefore = await this.availabilityRepository.countActivePeriodsByWorkingHoursId(workingHoursId);
        if (wh.isActive && countBefore <= 1) {
            throw new BusinessRuleException('WORKING_HOURS_ACTIVE_REQUIRES_PERIOD', 'Não é possível remover o último período de uma jornada ativa.');
        }
        await this.availabilityRepository.softDeleteWorkingHoursPeriod(periodId, tenantId);
    }
}
