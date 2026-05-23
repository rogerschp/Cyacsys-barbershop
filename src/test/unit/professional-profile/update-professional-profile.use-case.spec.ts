import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateProfessionalProfileUseCase } from 'src/modules/professional-profile/use-cases/update-professional-profile.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { ProfessionalProfileEntity } from 'src/modules/professional-profile/entities/professional-profile.entity';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';

describe('UpdateProfessionalProfileUseCase', () => {
  let useCase: UpdateProfessionalProfileUseCase;
  let professionalProfileRepository: any;

  const userId = 'user-uuid';
  const mockProfile: ProfessionalProfileEntity = {
    id: 'profile-uuid',
    userId,
    displayName: 'João',
    bio: null,
    avatarUrl: 'https://example.com/a.jpg',
    professionalType: ProfessionalType.BARBER,
    bookingMode: BookingMode.DIRECT_BOOKING,
    whatsappNumber: null,
    instagramUsername: null,
    experienceYears: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ProfessionalProfileEntity;

  beforeEach(async () => {
    professionalProfileRepository = {
      findByUserIdNonDeleted: jest
        .fn<() => Promise<ProfessionalProfileEntity | null>>()
        .mockResolvedValue(mockProfile),
      update: jest
        .fn<() => Promise<ProfessionalProfileEntity>>()
        .mockResolvedValue({ ...mockProfile, displayName: 'Novo' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfessionalProfileUseCase,
        {
          provide: PROFESSIONAL_PROFILE_REPOSITORY,
          useValue: professionalProfileRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateProfessionalProfileUseCase);
  });

  it('atualiza campos informados', async () => {
    await useCase.run(userId, { displayName: 'Novo Nome' });
    expect(professionalProfileRepository.update).toHaveBeenCalledWith(
      mockProfile.id,
      userId,
      { displayName: 'Novo Nome' },
    );
  });

  it('retorna existente quando dto vazio', async () => {
    const result = await useCase.run(userId, {});
    expect(result).toEqual(mockProfile);
    expect(professionalProfileRepository.update).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando não há perfil', async () => {
    professionalProfileRepository.findByUserIdNonDeleted.mockResolvedValue(
      null,
    );
    await expect(useCase.run(userId, { displayName: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
