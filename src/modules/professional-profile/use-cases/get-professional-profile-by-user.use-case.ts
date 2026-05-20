import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
} from '../interfaces/professional-profile-repository.interface';

@Injectable()
export class GetProfessionalProfileByUserUseCase {
  constructor(
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
  ) {}

  async run(userId: string): Promise<ProfessionalProfileEntity> {
    const profile =
      await this.professionalProfileRepository.findByUserIdNonDeleted(userId);
    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }
    return profile;
  }
}
