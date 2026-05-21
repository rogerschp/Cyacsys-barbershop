import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { UpdateBlockDto } from '../dto/update-block.dto';
import { BlockReason } from '../entities/block-reason.enum';
import { ProfessionalAvailabilityBlockEntity } from '../entities/professional-availability-block.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { normalizeDateColumn } from '../utils/time-range.utils';
import { assertValidBlockRange } from '../utils/validate-block-range';
@Injectable()
export class UpdateBlockUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, blockId: string, dto: UpdateBlockDto, userId: string, callerRole?: string): Promise<ProfessionalAvailabilityBlockEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const existing = await this.availabilityRepository.findBlockById(blockId, tenantId);
        if (!existing || existing.tenantProfessionalId !== tenantProfessionalId) {
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
