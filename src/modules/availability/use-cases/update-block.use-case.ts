import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { UpdateBlockDto } from '../dto/update-block.dto';
import { BlockReason } from '../entities/block-reason.enum';
import { BarberAvailabilityBlockEntity } from '../entities/barber-availability-block.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { normalizeDateColumn } from '../utils/time-range.utils';
import { assertValidBlockRange } from '../utils/validate-block-range';
@Injectable()
export class UpdateBlockUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly tenantUserService: TenantUserService) { }
    async run(tenantId: string, barberProfileId: string, blockId: string, dto: UpdateBlockDto, userId: string, callerRole?: string): Promise<BarberAvailabilityBlockEntity> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            tenantUserService: this.tenantUserService,
        });
        const existing = await this.availabilityRepository.findBlockById(blockId, tenantId);
        if (!existing || existing.barberProfileId !== barberProfileId) {
            throw new NotFoundException('Block not found');
        }
        if (existing.reason === BlockReason.BOOKING) {
            throw new BusinessRuleException('BLOCK_REASON_RESERVED', 'Bloqueios vinculados a agendamento (BOOKING) não podem ser editados manualmente.');
        }
        const nextStart = dto.startTime ?? existing.startTime;
        const nextEnd = dto.endTime ?? existing.endTime;
        assertValidBlockRange(nextStart, nextEnd);
        const nextDate = dto.date !== undefined
            ? dto.date
            : normalizeDateColumn(existing.date as string | Date);
        return this.availabilityRepository.updateBlock(blockId, tenantId, {
            date: nextDate,
            startTime: nextStart,
            endTime: nextEnd,
            ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
        });
    }
}
