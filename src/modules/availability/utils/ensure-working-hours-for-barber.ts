import { NotFoundException } from '@nestjs/common';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import { IAvailabilityRepository } from '../interfaces/availability-repository.interface';

export async function ensureWorkingHoursForBarber(
  availabilityRepository: IAvailabilityRepository,
  workingHoursId: string,
  barberProfileId: string,
  tenantId: string,
  withPeriods = false,
): Promise<WorkingHoursEntity> {
  const wh = await availabilityRepository.findWorkingHoursById(
    workingHoursId,
    tenantId,
    withPeriods,
  );
  if (!wh || wh.barberProfileId !== barberProfileId) {
    throw new NotFoundException('Working hours not found');
  }
  return wh;
}
