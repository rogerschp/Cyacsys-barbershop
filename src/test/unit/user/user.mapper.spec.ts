import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { UserMapper } from 'src/modules/user/mappers/user.mapper';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserStatus } from 'src/modules/user/entities/user-status.enum';
import { Role } from 'src/common/enums/role.enum';

describe('UserMapper', () => {
  const baseUser: UserEntity = {
    id: 'user-uuid',
    firebaseUid: 'firebase-uid',
    email: 'user@email.com',
    name: 'João',
    passwordHash: null,
    status: UserStatus.ACTIVE,
    role: Role.CLIENT,
    telephone: '5511999999999',
    addressId: null,
    address: null,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
  };

  it('retorna professionalProfile null quando ausente', () => {
    const dto = UserMapper.toResponse(baseUser);
    expect(dto.professionalProfile).toBeNull();
  });

  it('mapeia professionalProfile quando carregado na entidade', () => {
    const dto = UserMapper.toResponse({
      ...baseUser,
      professionalProfile: {
        id: 'pp-uuid',
        userId: baseUser.id,
        displayName: 'João Pro',
        bio: 'Bio',
        avatarUrl: 'https://example.com/a.jpg',
        professionalType: ProfessionalType.BARBER,
        bookingMode: BookingMode.DIRECT_BOOKING,
        whatsappNumber: '5511999999999',
        instagramUsername: 'joao',
        experienceYears: 3,
        isActive: true,
        createdAt: new Date('2022-01-01'),
        updatedAt: new Date('2022-01-01'),
      } as UserEntity['professionalProfile'],
    });

    expect(dto.professionalProfile).toMatchObject({
      id: 'pp-uuid',
      userId: 'user-uuid',
      displayName: 'João Pro',
      professionalType: ProfessionalType.BARBER,
      bookingMode: BookingMode.DIRECT_BOOKING,
    });
  });
});
