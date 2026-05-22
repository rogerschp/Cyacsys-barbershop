import { ProfessionalProfileResponseDto } from '../dto/professional-profile-response.dto';
import { ProfessionalProfileEntity } from '../entities/professional-profile.entity';

export class ProfessionalProfileMapper {
  static toResponse(
    profile: ProfessionalProfileEntity,
  ): ProfessionalProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      professionalType: profile.professionalType,
      bookingMode: profile.bookingMode,
      whatsappNumber: profile.whatsappNumber,
      instagramUsername: profile.instagramUsername,
      experienceYears: profile.experienceYears,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
