import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { UpdateProfessionalProfileDto } from '../dto/update-professional-profile.dto';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
  UpdateProfessionalProfileData,
} from '../interfaces/professional-profile-repository.interface';
import {
  assertValidInstagramUsername,
  assertValidWhatsappNumber,
  normalizeInstagramUsername,
  normalizeWhatsappNumber,
} from '../utils/professional-contact.utils';

@Injectable()
export class UpdateProfessionalProfileUseCase {
  private readonly logger = new Logger(UpdateProfessionalProfileUseCase.name);

  constructor(
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
  ) {}

  async run(
    userId: string,
    dto: UpdateProfessionalProfileDto,
  ): Promise<ProfessionalProfileEntity> {
    const existing =
      await this.professionalProfileRepository.findByUserIdNonDeleted(userId);
    if (!existing) {
      throw new NotFoundException('Professional profile not found');
    }

    const updates: UpdateProfessionalProfileData = {};

    if (dto.displayName !== undefined) {
      updates.displayName = dto.displayName.trim();
    }
    if (dto.bio !== undefined) {
      updates.bio = dto.bio ?? null;
    }
    if (dto.avatarUrl !== undefined) {
      updates.avatarUrl = dto.avatarUrl;
    }
    if (dto.professionalType !== undefined) {
      updates.professionalType = dto.professionalType;
    }
    if (dto.bookingMode !== undefined) {
      updates.bookingMode = dto.bookingMode;
    }
    if (dto.experienceYears !== undefined) {
      if (dto.experienceYears < 0) {
        throw new BusinessRuleException(
          'INVALID_EXPERIENCE_YEARS',
          'experienceYears não pode ser negativo.',
        );
      }
      updates.experienceYears = dto.experienceYears;
    }
    if (dto.whatsappNumber !== undefined) {
      const whatsappNumber = normalizeWhatsappNumber(dto.whatsappNumber);
      assertValidWhatsappNumber(whatsappNumber);
      updates.whatsappNumber = whatsappNumber;
    }
    if (dto.instagramUsername !== undefined) {
      const instagramUsername = normalizeInstagramUsername(
        dto.instagramUsername,
      );
      assertValidInstagramUsername(instagramUsername);
      updates.instagramUsername = instagramUsername;
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    const updated = await this.professionalProfileRepository.update(
      existing.id,
      userId,
      updates,
    );

    this.logger.log({
      event: 'professional_profile_updated',
      userId,
      professionalProfileId: existing.id,
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
