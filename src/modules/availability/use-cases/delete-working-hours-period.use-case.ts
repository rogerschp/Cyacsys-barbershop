import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { ensureWorkingHoursForTenantProfessional } from '../utils/ensure-working-hours-for-tenant-professional';
@Injectable()
export class DeleteWorkingHoursPeriodUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, workingHoursId: string, periodId: string, userId: string, callerRole?: string): Promise<void> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const wh = await ensureWorkingHoursForTenantProfessional(this.availabilityRepository, workingHoursId, tenantProfessionalId, tenantId, false);
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
