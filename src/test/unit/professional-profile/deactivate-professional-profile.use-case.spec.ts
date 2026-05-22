import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeactivateProfessionalProfileUseCase } from 'src/modules/professional-profile/use-cases/deactivate-professional-profile.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { ProfessionalProfileEntity } from 'src/modules/professional-profile/entities/professional-profile.entity';

describe('DeactivateProfessionalProfileUseCase', () => {
  let useCase: DeactivateProfessionalProfileUseCase;
  let professionalProfileRepository: any;

  const userId = 'user-uuid';
  const mockProfile = {
    id: 'profile-uuid',
    userId,
    isActive: true,
  } as ProfessionalProfileEntity;

  beforeEach(async () => {
    professionalProfileRepository = {
      findByUserIdNonDeleted: jest
        .fn<() => Promise<ProfessionalProfileEntity | null>>()
        .mockResolvedValue(mockProfile),
      update: jest
        .fn<() => Promise<ProfessionalProfileEntity>>()
        .mockResolvedValue({ ...mockProfile, isActive: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeactivateProfessionalProfileUseCase,
        {
          provide: PROFESSIONAL_PROFILE_REPOSITORY,
          useValue: professionalProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get(DeactivateProfessionalProfileUseCase);
  });

  it('define isActive false', async () => {
    await useCase.run(userId);
    expect(professionalProfileRepository.update).toHaveBeenCalledWith(
      mockProfile.id,
      userId,
      { isActive: false },
    );
  });

  it('lança quando perfil não existe', async () => {
    professionalProfileRepository.findByUserIdNonDeleted.mockResolvedValue(
      null,
    );
    await expect(useCase.run(userId)).rejects.toThrow(NotFoundException);
  });
});
