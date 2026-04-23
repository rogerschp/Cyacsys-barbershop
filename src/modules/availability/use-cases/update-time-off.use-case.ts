import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { UpdateTimeOffDto } from '../dto/update-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { normalizeDateColumn } from '../utils/time-range.utils';
import { normalizeTimeOffTimes } from '../utils/validate-time-off-range';
@Injectable()
export class UpdateTimeOffUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly tenantUserService: TenantUserService) { }
    async run(tenantId: string, barberProfileId: string, timeOffId: string, dto: UpdateTimeOffDto, userId: string, callerRole?: string): Promise<TimeOffEntity> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            tenantUserService: this.tenantUserService,
        });
        const existing = await this.availabilityRepository.findTimeOffById(timeOffId, tenantId);
        if (!existing || existing.barberProfileId !== barberProfileId) {
            throw new NotFoundException('Time off not found');
        }
        const nextDate = dto.date !== undefined
            ? dto.date
            : normalizeDateColumn(existing.date as string | Date);
        if (!DateTime.fromISO(nextDate).isValid) {
            throw new BusinessRuleException('INVALID_DATE', 'Data inválida. Use yyyy-MM-dd.');
        }
        const mergedStart = dto.startTime !== undefined ? dto.startTime : existing.startTime;
        const mergedEnd = dto.endTime !== undefined ? dto.endTime : existing.endTime;
        const norm = normalizeTimeOffTimes(mergedStart, mergedEnd);
        return this.availabilityRepository.updateTimeOff(timeOffId, tenantId, {
            date: nextDate,
            startTime: norm.startTime,
            endTime: norm.endTime,
            ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        });
    }
}
