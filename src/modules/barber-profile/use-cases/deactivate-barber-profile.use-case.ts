import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { BarberProfileEntity } from '../entities/barber-profile.entity';
import {
  BARBER_PROFILE_REPOSITORY,
  IBarberProfileRepository,
} from '../interfaces/barber-profile-repository.interface';

@Injectable()
export class DeactivateBarberProfileUseCase {
  private readonly logger = new Logger(DeactivateBarberProfileUseCase.name);

  constructor(
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
  ) {}

  async run(
    tenantId: string,
    barberProfileId: string,
    performedBy: string,
  ): Promise<BarberProfileEntity> {
    const existing = await this.barberProfileRepository.findById(
      barberProfileId,
      tenantId,
    );
    if (!existing) {
      throw new NotFoundException('Barber profile not found');
    }

    const updated = await this.barberProfileRepository.update(
      barberProfileId,
      tenantId,
      { isActive: false },
    );

    this.logger.log({
      event: 'barber_profile_deactivated',
      tenantId,
      barberProfileId,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
