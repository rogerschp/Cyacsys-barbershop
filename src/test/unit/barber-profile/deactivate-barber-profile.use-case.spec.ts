import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeactivateBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/deactivate-barber-profile.use-case';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';

describe('DeactivateBarberProfileUseCase', () => {
  let useCase: DeactivateBarberProfileUseCase;
  let barberProfileRepository: { findById: jest.Mock; update: jest.Mock };

  const tenantId = 'tenant-uuid';
  const profileId = 'profile-uuid';
  const performedBy = 'user-uuid';
  const mockProfile: BarberProfileEntity = {
    id: profileId,
    tenantId,
    tenantUserId: 'tenant-user-uuid',
    displayName: 'João Barbeiro',
    bio: null,
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
      update: jest
        .fn()
        .mockResolvedValue({ ...mockProfile, isActive: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeactivateBarberProfileUseCase,
        { provide: BARBER_PROFILE_REPOSITORY, useValue: barberProfileRepository },
      ],
    }).compile();

    useCase = module.get<DeactivateBarberProfileUseCase>(
      DeactivateBarberProfileUseCase,
    );
  });

  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });

  describe('run', () => {
    it('deve desativar perfil e retornar entidade atualizada', async () => {
      const result = await useCase.run(tenantId, profileId, performedBy);

      expect(barberProfileRepository.findById).toHaveBeenCalledWith(
        profileId,
        tenantId,
      );
      expect(barberProfileRepository.update).toHaveBeenCalledWith(
        profileId,
        tenantId,
        { isActive: false },
      );
      expect(result.isActive).toBe(false);
    });

    it('deve lançar NotFoundException quando perfil não existe', async () => {
      barberProfileRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.run(tenantId, profileId, performedBy),
      ).rejects.toThrow(NotFoundException);

      expect(barberProfileRepository.update).not.toHaveBeenCalled();
    });
  });
});
