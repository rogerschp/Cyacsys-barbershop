import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
} from '../interfaces/professional-profile-repository.interface';

@Injectable()
export class DeactivateProfessionalProfileUseCase {
  private readonly logger = new Logger(
    DeactivateProfessionalProfileUseCase.name,
  );

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
      { isActive: false },
    );

    this.logger.log({
      event: 'professional_profile_deactivated',
      userId,
      professionalProfileId: existing.id,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
