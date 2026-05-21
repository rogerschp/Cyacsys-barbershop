import { ProfessionalProfileMapper } from '../../professional-profile/mappers/professional-profile.mapper';
import { TenantProfessionalResponseDto } from '../dto/tenant-professional-response.dto';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';

export class TenantProfessionalMapper {
  static toResponse(
    entity: TenantProfessionalEntity,
  ): TenantProfessionalResponseDto {
    if (!entity.professionalProfile) {
      throw new Error(
        'TenantProfessionalMapper requires professionalProfile relation',
      );
    }
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      professionalProfileId: entity.professionalProfileId,
      role: entity.role,
      status: entity.status,
      joinedAt: entity.joinedAt,
      leftAt: entity.leftAt,
      createdAt: entity.createdAt,
      professionalProfile: ProfessionalProfileMapper.toResponse(
        entity.professionalProfile,
      ),
    };
  }

  static toResponseList(
    entities: TenantProfessionalEntity[],
  ): TenantProfessionalResponseDto[] {
    return entities.map((entity) => TenantProfessionalMapper.toResponse(entity));
  }
}
