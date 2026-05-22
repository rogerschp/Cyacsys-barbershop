import { TenantProfessionalMapper } from 'src/modules/tenant-professional/mappers/tenant-professional.mapper';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { TenantProfessionalEntity } from 'src/modules/tenant-professional/entities/tenant-professional.entity';

describe('TenantProfessionalMapper', () => {
  const professionalProfile = {
    id: 'profile-uuid',
    userId: 'user-uuid',
    displayName: 'Maria',
    bio: null,
    avatarUrl: 'https://example.com/a.jpg',
    professionalType: ProfessionalType.MANICURE,
    bookingMode: BookingMode.DIRECT_BOOKING,
    whatsappNumber: null,
    instagramUsername: null,
    experienceYears: 3,
    isActive: true,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
  };

  const entity = {
    id: 'tp-uuid',
    tenantId: 'tenant-uuid',
    professionalProfileId: 'profile-uuid',
    role: TenantUserRole.BARBER,
    status: TenantProfessionalStatus.ACTIVE,
    joinedAt: new Date('2021-06-01'),
    leftAt: null,
    createdAt: new Date('2021-06-01'),
    professionalProfile,
  } as TenantProfessionalEntity;

  it('toResponse inclui professionalProfile mapeado', () => {
    const dto = TenantProfessionalMapper.toResponse(entity);
    expect(dto.id).toBe('tp-uuid');
    expect(dto.professionalProfile.displayName).toBe('Maria');
    expect(dto.professionalProfile.professionalType).toBe(ProfessionalType.MANICURE);
  });

  it('toResponseList mapeia todos os itens', () => {
    const list = TenantProfessionalMapper.toResponseList([entity]);
    expect(list).toHaveLength(1);
    expect(list[0].professionalProfile.id).toBe('profile-uuid');
  });

  it('toResponse falha sem relação professionalProfile', () => {
    const withoutRelation = { ...entity, professionalProfile: undefined };
    expect(() =>
      TenantProfessionalMapper.toResponse(withoutRelation as TenantProfessionalEntity),
    ).toThrow(/professionalProfile relation/);
  });
});
