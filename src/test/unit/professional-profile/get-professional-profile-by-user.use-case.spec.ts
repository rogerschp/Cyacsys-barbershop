import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetProfessionalProfileByUserUseCase } from 'src/modules/professional-profile/use-cases/get-professional-profile-by-user.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';

describe('GetProfessionalProfileByUserUseCase', () => {
  let useCase: GetProfessionalProfileByUserUseCase;
  let professionalProfileRepository: any;

  const userId = 'user-uuid';
  const mockProfile = { id: 'profile-uuid', userId };

  beforeEach(async () => {
    professionalProfileRepository = {
      findByUserIdNonDeleted: jest
        .fn<() => Promise<{ id: string; userId: string } | null>>()
        .mockResolvedValue(mockProfile),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfessionalProfileByUserUseCase,
        {
          provide: PROFESSIONAL_PROFILE_REPOSITORY,
          useValue: professionalProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get(GetProfessionalProfileByUserUseCase);
  });

  it('retorna perfil quando existe', async () => {
    const result = await useCase.run(userId);
    expect(result).toEqual(mockProfile);
  });

  it('lança NotFoundException quando não existe', async () => {
    professionalProfileRepository.findByUserIdNonDeleted.mockResolvedValue(
      null,
    );
    await expect(useCase.run(userId)).rejects.toThrow(NotFoundException);
  });
});
