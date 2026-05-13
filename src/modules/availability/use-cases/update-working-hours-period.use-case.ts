import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { UpdateWorkingHoursPeriodDto } from '../dto/update-working-hours-period.dto';
import { WorkingHoursPeriodEntity } from '../entities/working-hours-period.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { ensureWorkingHoursForBarber } from '../utils/ensure-working-hours-for-barber';
import { validatePeriodsNoOverlap } from '../utils/validate-periods-no-overlap';
@Injectable()
export class UpdateWorkingHoursPeriodUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase) { }
    async run(tenantId: string, barberProfileId: string, workingHoursId: string, periodId: string, dto: UpdateWorkingHoursPeriodDto, userId: string, callerRole?: string): Promise<WorkingHoursPeriodEntity> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
        });
        await ensureWorkingHoursForBarber(this.availabilityRepository, workingHoursId, barberProfileId, tenantId, false);
        const period = await this.availabilityRepository.findWorkingHoursPeriodById(periodId, tenantId);
        if (!period || period.workingHoursId !== workingHoursId) {
            throw new NotFoundException('Working hours period not found');
        }
        const nextStart = dto.startTime ?? period.startTime;
        const nextEnd = dto.endTime ?? period.endTime;
        const others = await this.availabilityRepository.listPeriodsByWorkingHoursId(workingHoursId, tenantId);
        const peer = others
            .filter((p) => p.id !== periodId)
            .map((p) => ({ startTime: p.startTime, endTime: p.endTime }));
        validatePeriodsNoOverlap([
            ...peer,
            { startTime: nextStart, endTime: nextEnd },
        ]);
        if (dto.startTime === undefined && dto.endTime === undefined) {
            return period;
        }
        return this.availabilityRepository.updateWorkingHoursPeriod(periodId, tenantId, {
            ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
            ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        });
    }
}
