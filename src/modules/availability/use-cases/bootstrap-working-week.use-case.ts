import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { BootstrapWorkingWeekDto } from '../dto/bootstrap-working-week.dto';
import { BootstrapWorkingWeekResponseDto } from '../dto/bootstrap-working-week-response.dto';
import { DayOfWeek } from '../entities/day-of-week.enum';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { validatePeriodsNoOverlap } from '../utils/validate-periods-no-overlap';

const ALL_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

@Injectable()
export class BootstrapWorkingWeekUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    dto: BootstrapWorkingWeekDto,
    userId: string,
    callerRole?: string,
  ): Promise<BootstrapWorkingWeekResponseDto> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });

    if (!dto.periods?.length) {
      throw new BusinessRuleException(
        'WORKING_HOURS_ACTIVE_REQUIRES_PERIOD',
        'Informe pelo menos um período para os dias abertos.',
      );
    }

    validatePeriodsNoOverlap(dto.periods);

    const closedDays = new Set<DayOfWeek>(dto.closedDays ?? []);
    const overwriteExisting = dto.overwriteExisting !== false;

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const dayOfWeek of ALL_DAYS) {
      const shouldBeActive = !closedDays.has(dayOfWeek);
      const existing =
        await this.availabilityRepository.findWorkingHoursByProfessionalAndDay(
          tenantProfessionalId,
          tenantId,
          dayOfWeek,
          false,
        );

      if (!existing) {
        const createdWh = await this.availabilityRepository.createWorkingHours({
          tenantId,
          tenantProfessionalId,
          dayOfWeek,
          isActive: shouldBeActive,
        });

        if (shouldBeActive) {
          for (const period of dto.periods) {
            await this.availabilityRepository.createWorkingHoursPeriod({
              workingHoursId: createdWh.id,
              startTime: period.startTime,
              endTime: period.endTime,
            });
          }
        }

        created += 1;
        continue;
      }

      if (!overwriteExisting) {
        skipped += 1;
        continue;
      }

      await this.availabilityRepository.updateWorkingHours(
        existing.id,
        tenantId,
        {
          isActive: shouldBeActive,
        },
      );

      const existingPeriods =
        await this.availabilityRepository.listPeriodsByWorkingHoursId(
          existing.id,
          tenantId,
        );
      for (const period of existingPeriods) {
        await this.availabilityRepository.softDeleteWorkingHoursPeriod(
          period.id,
          tenantId,
        );
      }

      if (shouldBeActive) {
        for (const period of dto.periods) {
          await this.availabilityRepository.createWorkingHoursPeriod({
            workingHoursId: existing.id,
            startTime: period.startTime,
            endTime: period.endTime,
          });
        }
      }

      updated += 1;
    }

    return { created, updated, skipped };
  }
}
