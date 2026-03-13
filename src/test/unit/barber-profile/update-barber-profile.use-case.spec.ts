import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/update-barber-profile.use-case';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';
import { UpdateBarberProfileDto } from 'src/modules/barber-profile/dto/update-barber-profile.dto';

describe('UpdateBarberProfileUseCase', () => {
  let useCase: UpdateBarberProfileUseCase;
  let barberProfileRepository: {
    findById: jest.Mock;
    update: jest.Mock;
  };
  let tenantUserService: { getByIdAndTenant: jest.Mock };

  const tenantId = 'tenant-uuid';
  const profileId = 'profile-uuid';
  const tenantUserId = 'tenant-user-uuid';
  const currentUserId = 'current-user-uuid';
  const mockProfile: BarberProfileEntity = {
    id: profileId,
    tenantId,
    tenantUserId,
    displayName: 'João Barbeiro',
    bio: 'Bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    experienceYears: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as BarberProfileEntity;

  beforeEach(async () => {
    barberProfileRepository = {
      findById: jest.fn().mockResolvedValue(mockProfile),
      update: jest.fn().mockResolvedValue({ ...mockProfile, displayName: 'Novo Nome' }),
    };
    tenantUserService = {
      getByIdAndTenant: jest.fn().mockResolvedValue({
        id: tenantUserId,
        tenantId,
        userId: currentUserId,
        role: TenantUserRole.BARBER,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateBarberProfileUseCase,
        { provide: BARBER_PROFILE_REPOSITORY, useValue: barberProfileRepository },
        { provide: TenantUserService, useValue: tenantUserService },
      ],
    }).compile();

    useCase = module.get<UpdateBarberProfileUseCase>(UpdateBarberProfileUseCase);
  });

  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });

  describe('run (caller não BARBER)', () => {
    it('deve atualizar displayName quando caller é ADMIN', async () => {
      const dto: UpdateBarberProfileDto = { displayName: 'Novo Nome' };
      const updated = { ...mockProfile, displayName: 'Novo Nome' };
      barberProfileRepository.update.mockResolvedValue(updated);

      const result = await useCase.run(
        tenantId,
        profileId,
        dto,
        currentUserId,
        TenantUserRole.ADMIN,
      );

      expect(barberProfileRepository.findById).toHaveBeenCalledWith(
        profileId,
        tenantId,
      );
      expect(tenantUserService.getByIdAndTenant).not.toHaveBeenCalled();
      expect(barberProfileRepository.update).toHaveBeenCalledWith(
        profileId,
        tenantId,
        { displayName: 'Novo Nome' },
      );
      expect(result.displayName).toBe('Novo Nome');
    });

    it('deve lançar NotFoundException quando perfil não existe', async () => {
      barberProfileRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.run(tenantId, profileId, { displayName: 'X' }, currentUserId),
      ).rejects.toThrow(NotFoundException);

      expect(barberProfileRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessRuleException quando experienceYears negativo', async () => {
      await expect(
        useCase.run(
          tenantId,
          profileId,
          { experienceYears: -1 },
          currentUserId,
          TenantUserRole.ADMIN,
        ),
      ).rejects.toThrow(BusinessRuleException);

      expect(barberProfileRepository.update).not.toHaveBeenCalled();
    });

    it('deve retornar existente quando dto vazio', async () => {
      const result = await useCase.run(
        tenantId,
        profileId,
        {},
        currentUserId,
        TenantUserRole.ADMIN,
      );

      expect(barberProfileRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });
  });

  describe('run (caller BARBER)', () => {
    it('deve atualizar avatar e bio quando BARBER edita próprio perfil', async () => {
      const dto: UpdateBarberProfileDto = {
        avatarUrl: 'https://new.com/avatar.jpg',
        bio: 'Nova bio',
      };
      const updated = { ...mockProfile, ...dto };
      barberProfileRepository.update.mockResolvedValue(updated);

      const result = await useCase.run(
        tenantId,
        profileId,
        dto,
        currentUserId,
        TenantUserRole.BARBER,
      );

      expect(tenantUserService.getByIdAndTenant).toHaveBeenCalledWith(
        tenantUserId,
        tenantId,
      );
      expect(barberProfileRepository.update).toHaveBeenCalledWith(
        profileId,
        tenantId,
        { avatarUrl: dto.avatarUrl, bio: 'Nova bio' },
      );
      expect(result.avatarUrl).toBe(dto.avatarUrl);
      expect(result.bio).toBe('Nova bio');
    });

    it('deve lançar ForbiddenException quando BARBER tenta editar perfil de outro', async () => {
      tenantUserService.getByIdAndTenant.mockResolvedValue({
        id: tenantUserId,
        tenantId,
        userId: 'outro-user-id',
        role: TenantUserRole.BARBER,
      });

      await expect(
        useCase.run(
          tenantId,
          profileId,
          { bio: 'Nova bio' },
          currentUserId,
          TenantUserRole.BARBER,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(barberProfileRepository.update).not.toHaveBeenCalled();
    });

    it('deve ignorar displayName e experienceYears quando caller é BARBER', async () => {
      const dto: UpdateBarberProfileDto = {
        displayName: 'Nome Alterado',
        experienceYears: 10,
        bio: 'Só bio',
      };
      barberProfileRepository.update.mockResolvedValue({
        ...mockProfile,
        bio: 'Só bio',
      });

      await useCase.run(
        tenantId,
        profileId,
        dto,
        currentUserId,
        TenantUserRole.BARBER,
      );

      expect(barberProfileRepository.update).toHaveBeenCalledWith(
        profileId,
        tenantId,
        { bio: 'Só bio' },
      );
    });
  });
});
