import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { UpdateWorkingHoursDto } from '../dto/update-working-hours.dto';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { ensureWorkingHoursForTenantProfessional } from '../utils/ensure-working-hours-for-tenant-professional';
@Injectable()
export class UpdateWorkingHoursUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, workingHoursId: string, dto: UpdateWorkingHoursDto, userId: string, callerRole?: string): Promise<WorkingHoursEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const existing = await ensureWorkingHoursForTenantProfessional(this.availabilityRepository, workingHoursId, tenantProfessionalId, tenantId, false);
        if (dto.dayOfWeek !== undefined && dto.dayOfWeek !== existing.dayOfWeek) {
            const clash = await this.availabilityRepository.existsOtherWorkingHoursForDay(tenantProfessionalId, tenantId, dto.dayOfWeek, workingHoursId);
            if (clash) {
                throw new BusinessRuleException('WORKING_HOURS_ALREADY_EXISTS', 'Já existe jornada para este dia da semana.');
            }
        }
        const nextActive = dto.isActive !== undefined ? dto.isActive : existing.isActive;
        if (nextActive) {
            const count = await this.availabilityRepository.countActivePeriodsByWorkingHoursId(workingHoursId);
            if (count < 1) {
                throw new BusinessRuleException('WORKING_HOURS_ACTIVE_REQUIRES_PERIOD', 'WorkingHours ativo exige pelo menos um período.');
            }
        }
        if (dto.dayOfWeek === undefined && dto.isActive === undefined) {
            const full = await this.availabilityRepository.findWorkingHoursById(workingHoursId, tenantId, true);
            if (!full)
                throw new NotFoundException('Working hours not found');
            return full;
        }
        return this.availabilityRepository.updateWorkingHours(workingHoursId, tenantId, {
            ...(dto.dayOfWeek !== undefined ? { dayOfWeek: dto.dayOfWeek } : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        });
    }
}
