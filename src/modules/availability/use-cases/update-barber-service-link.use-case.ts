import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { UpdateBarberServiceLinkDto } from '../dto/update-barber-service-link.dto';
import { BarberServiceLinkEntity } from '../entities/barber-service-link.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';

@Injectable()
export class UpdateBarberServiceLinkUseCase {
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
    linkId: string,
    dto: UpdateBarberServiceLinkDto,
    userId: string,
    callerRole?: string,
  ): Promise<BarberServiceLinkEntity> {
    await assertBarberAgendaAccess({
      tenantId,
      barberProfileId,
      userId,
      callerRole,
      barberProfileRepository: this.barberProfileRepository,
      tenantUserService: this.tenantUserService,
    });

    const link = await this.availabilityRepository.findBarberServiceLinkById(
      linkId,
      tenantId,
    );
    if (!link || link.barberProfileId !== barberProfileId) {
      throw new NotFoundException('Barber service link not found');
    }

    if (dto.isActive === undefined) {
      return link;
    }

    return this.availabilityRepository.updateBarberServiceLink(
      linkId,
      tenantId,
      {
        isActive: dto.isActive,
      },
    );
  }
}
