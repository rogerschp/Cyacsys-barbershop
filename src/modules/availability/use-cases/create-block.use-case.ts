import { Inject, Injectable } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { CreateBlockDto } from '../dto/create-block.dto';
import { ProfessionalAvailabilityBlockEntity } from '../entities/professional-availability-block.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { assertValidBlockRange } from '../utils/validate-block-range';
@Injectable()
export class CreateBlockUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, dto: CreateBlockDto, userId: string, callerRole?: string): Promise<ProfessionalAvailabilityBlockEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        assertValidBlockRange(dto.startTime, dto.endTime);
        return this.availabilityRepository.createBlock({
            tenantId,
            tenantProfessionalId,
            date: dto.date,
            startTime: dto.startTime,
            endTime: dto.endTime,
            reason: dto.reason,
            bookingId: null,
        });
    }
}
