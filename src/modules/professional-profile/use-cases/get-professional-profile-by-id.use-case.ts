import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
} from '../interfaces/professional-profile-repository.interface';

@Injectable()
export class GetProfessionalProfileByIdUseCase {
  constructor(
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
  ) {}

  async run(id: string): Promise<ProfessionalProfileEntity> {
    const profile = await this.professionalProfileRepository.findById(id);
    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }
    return profile;
  }
}
