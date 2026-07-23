import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
} from '../interfaces/professional-profile-repository.interface';

@Injectable()
export class ActivateProfessionalProfileUseCase {
  private readonly logger = new Logger(ActivateProfessionalProfileUseCase.name);

  constructor(
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
  ) {}

  async run(userId: string): Promise<ProfessionalProfileEntity> {
    const existing =
      await this.professionalProfileRepository.findByUserIdNonDeleted(userId);
    if (!existing) {
      throw new NotFoundException('Professional profile not found');
    }

    const updated = await this.professionalProfileRepository.update(
      existing.id,
      userId,
      { isActive: true },
    );

    this.logger.log({
      event: 'professional_profile_activated',
      userId,
      professionalProfileId: existing.id,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
