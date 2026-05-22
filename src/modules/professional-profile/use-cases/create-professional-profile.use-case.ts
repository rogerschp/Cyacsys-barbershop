import { Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindUserByIdUseCase } from '../../user/use-cases/find-user-by-id.use-case';
import { BookingMode } from '../entities/booking-mode.enum';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';
import { CreateProfessionalProfileDto } from '../dto/create-professional-profile.dto';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
} from '../interfaces/professional-profile-repository.interface';
import {
  assertValidInstagramUsername,
  assertValidWhatsappNumber,
  normalizeInstagramUsername,
  normalizeWhatsappNumber,
} from '../utils/professional-contact.utils';

@Injectable()
export class CreateProfessionalProfileUseCase {
  private readonly logger = new Logger(CreateProfessionalProfileUseCase.name);

  constructor(
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  async run(
    userId: string,
    dto: CreateProfessionalProfileDto,
  ): Promise<ProfessionalProfileEntity> {
    await this.findUserByIdUseCase.run(userId);

    const existing =
      await this.professionalProfileRepository.findByUserIdNonDeleted(userId);
    if (existing) {
      throw new BusinessRuleException(
        'PROFESSIONAL_PROFILE_ALREADY_EXISTS',
        'Este usuário já possui um perfil profissional.',
        { userId },
      );
    }

    if (dto.experienceYears < 0) {
      throw new BusinessRuleException(
        'INVALID_EXPERIENCE_YEARS',
        'experienceYears não pode ser negativo.',
      );
    }

    const whatsappNumber = normalizeWhatsappNumber(dto.whatsappNumber);
    const instagramUsername = normalizeInstagramUsername(dto.instagramUsername);
    assertValidWhatsappNumber(whatsappNumber);
    assertValidInstagramUsername(instagramUsername);

    const profile = await this.professionalProfileRepository.create({
      userId,
      displayName: dto.displayName.trim(),
      bio: dto.bio ?? null,
      avatarUrl: dto.avatarUrl,
      professionalType: dto.professionalType,
      bookingMode: dto.bookingMode ?? BookingMode.DIRECT_BOOKING,
      whatsappNumber,
      instagramUsername,
      experienceYears: dto.experienceYears,
    });

    this.logger.log({
      event: 'professional_profile_created',
      userId,
      professionalProfileId: profile.id,
      professionalType: profile.professionalType,
      timestamp: new Date().toISOString(),
    });

    return profile;
  }
}
