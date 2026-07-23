import { PublicTenantProfessionalResponseDto } from '../dto/public-tenant-professional-response.dto';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';

export function mapToPublicTenantProfessional(
  entity: TenantProfessionalEntity,
): PublicTenantProfessionalResponseDto {
  const profile = entity.professionalProfile;
  if (!profile) {
    throw new Error(
      'mapToPublicTenantProfessional requires professionalProfile relation',
    );
  }
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    professionalProfileId: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarMedia?.url ?? null,
    professionalType: profile.professionalType,
    bookingMode: profile.bookingMode,
    whatsappNumber: profile.whatsappNumber,
    instagramUsername: profile.instagramUsername,
  };
}
