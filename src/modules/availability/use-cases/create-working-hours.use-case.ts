import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { CreateWorkingHoursDto } from '../dto/create-working-hours.dto';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { validatePeriodsNoOverlap } from '../utils/validate-periods-no-overlap';
@Injectable()
export class CreateWorkingHoursUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, dto: CreateWorkingHoursDto, userId: string, callerRole?: string): Promise<WorkingHoursEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const isActive = dto.isActive !== false;
        const exists = await this.availabilityRepository.existsOtherWorkingHoursForDay(tenantProfessionalId, tenantId, dto.dayOfWeek);
        if (exists) {
            throw new BusinessRuleException('WORKING_HOURS_ALREADY_EXISTS', 'Já existe jornada para este dia da semana.');
        }
        if (isActive && (!dto.periods || dto.periods.length === 0)) {
            throw new BusinessRuleException('WORKING_HOURS_ACTIVE_REQUIRES_PERIOD', 'WorkingHours ativo exige pelo menos um período.');
        }
        if (dto.periods?.length) {
            validatePeriodsNoOverlap(dto.periods);
        }
        const wh = await this.availabilityRepository.createWorkingHours({
            tenantId,
            tenantProfessionalId,
            dayOfWeek: dto.dayOfWeek,
            isActive,
        });
        if (dto.periods?.length) {
            for (const p of dto.periods) {
                await this.availabilityRepository.createWorkingHoursPeriod({
                    workingHoursId: wh.id,
                    startTime: p.startTime,
                    endTime: p.endTime,
                });
            }
        }
        return ((await this.availabilityRepository.findWorkingHoursById(wh.id, tenantId, true)) ?? wh);
    }
}
