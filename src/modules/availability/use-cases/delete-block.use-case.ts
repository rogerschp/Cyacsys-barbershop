import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { BarberAvailabilityBlockEntity } from '../entities/barber-availability-block.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';

@Injectable()
export class DeleteBlockUseCase {
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
    blockId: string,
    userId: string,
    callerRole?: string,
  ): Promise<BarberAvailabilityBlockEntity> {
    await assertBarberAgendaAccess({
      tenantId,
      barberProfileId,
      userId,
      callerRole,
      barberProfileRepository: this.barberProfileRepository,
      tenantUserService: this.tenantUserService,
    });

    const existing = await this.availabilityRepository.findBlockById(
      blockId,
      tenantId,
    );
    if (!existing || existing.barberProfileId !== barberProfileId) {
      throw new NotFoundException('Block not found');
    }

    return this.availabilityRepository.softDeleteBlock(blockId, tenantId);
  }
}
