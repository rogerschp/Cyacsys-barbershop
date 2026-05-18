import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { UpdateWorkingHoursDto } from '../dto/update-working-hours.dto';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { ensureWorkingHoursForBarber } from '../utils/ensure-working-hours-for-barber';
@Injectable()
export class UpdateWorkingHoursUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase) { }
    async run(tenantId: string, barberProfileId: string, workingHoursId: string, dto: UpdateWorkingHoursDto, userId: string, callerRole?: string): Promise<WorkingHoursEntity> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
        });
        const existing = await ensureWorkingHoursForBarber(this.availabilityRepository, workingHoursId, barberProfileId, tenantId, false);
        if (dto.dayOfWeek !== undefined && dto.dayOfWeek !== existing.dayOfWeek) {
            const clash = await this.availabilityRepository.existsOtherWorkingHoursForDay(barberProfileId, tenantId, dto.dayOfWeek, workingHoursId);
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
