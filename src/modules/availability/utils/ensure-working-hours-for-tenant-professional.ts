import { NotFoundException } from '@nestjs/common';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import { IAvailabilityRepository } from '../interfaces/availability-repository.interface';

export async function ensureWorkingHoursForTenantProfessional(
  availabilityRepository: IAvailabilityRepository,
  workingHoursId: string,
  tenantProfessionalId: string,
  tenantId: string,
  withPeriods = false,
): Promise<WorkingHoursEntity> {
  const wh = await availabilityRepository.findWorkingHoursById(
    workingHoursId,
    tenantId,
    withPeriods,
  );
  if (!wh || wh.tenantProfessionalId !== tenantProfessionalId) {
    throw new NotFoundException('Working hours not found');
  }
  return wh;
}
