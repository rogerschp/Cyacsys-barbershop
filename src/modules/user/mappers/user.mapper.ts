import { ProfessionalProfileMapper } from '../../professional-profile/mappers/professional-profile.mapper';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
      telephone: user.telephone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      address: user.address
        ? {
            street: user.address.street,
            number: user.address.number,
            city: user.address.city,
            state: user.address.state,
            zipCode: user.address.zipCode,
            country: user.address.country,
          }
        : null,
      professionalProfile: user.professionalProfile
        ? ProfessionalProfileMapper.toResponse(user.professionalProfile)
        : null,
    };
  }
}
