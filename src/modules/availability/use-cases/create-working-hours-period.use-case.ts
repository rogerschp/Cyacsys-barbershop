import { Inject, Injectable } from '@nestjs/common';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { CreateWorkingHoursPeriodDto } from '../dto/create-working-hours-period.dto';
import { WorkingHoursPeriodEntity } from '../entities/working-hours-period.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { ensureWorkingHoursForBarber } from '../utils/ensure-working-hours-for-barber';
import { validatePeriodsNoOverlap } from '../utils/validate-periods-no-overlap';
@Injectable()
export class CreateWorkingHoursPeriodUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase) { }
    async run(tenantId: string, barberProfileId: string, workingHoursId: string, dto: CreateWorkingHoursPeriodDto, userId: string, callerRole?: string): Promise<WorkingHoursPeriodEntity> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
        });
        const wh = await ensureWorkingHoursForBarber(this.availabilityRepository, workingHoursId, barberProfileId, tenantId, false);
        const existing = await this.availabilityRepository.listPeriodsByWorkingHoursId(workingHoursId, tenantId);
        validatePeriodsNoOverlap([
            ...existing.map((p) => ({
                startTime: p.startTime,
                endTime: p.endTime,
            })),
            { startTime: dto.startTime, endTime: dto.endTime },
        ]);
        return this.availabilityRepository.createWorkingHoursPeriod({
            workingHoursId: wh.id,
            startTime: dto.startTime,
            endTime: dto.endTime,
        });
    }
}
