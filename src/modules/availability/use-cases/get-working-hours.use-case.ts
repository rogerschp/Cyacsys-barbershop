import { Inject, Injectable } from '@nestjs/common';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { ensureWorkingHoursForBarber } from '../utils/ensure-working-hours-for-barber';

@Injectable()
export class GetWorkingHoursUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
    private readonly tenantUserService: TenantUserService,
  ) {}

  async run(
    tenantId: string,
    barberProfileId: string,
    workingHoursId: string,
    userId: string,
    callerRole?: string,
  ): Promise<WorkingHoursEntity> {
    await assertBarberAgendaAccess({
      tenantId,
      barberProfileId,
      userId,
      callerRole,
      barberProfileRepository: this.barberProfileRepository,
      tenantUserService: this.tenantUserService,
    });

    return ensureWorkingHoursForBarber(
      this.availabilityRepository,
      workingHoursId,
      barberProfileId,
      tenantId,
      true,
    );
  }
}
