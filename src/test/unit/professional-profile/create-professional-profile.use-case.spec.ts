import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreateProfessionalProfileUseCase } from 'src/modules/professional-profile/use-cases/create-professional-profile.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { FindUserByIdUseCase } from 'src/modules/user/use-cases/find-user-by-id.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { ProfessionalProfileEntity } from 'src/modules/professional-profile/entities/professional-profile.entity';
import { CreateProfessionalProfileDto } from 'src/modules/professional-profile/dto/create-professional-profile.dto';

describe('CreateProfessionalProfileUseCase', () => {
  let useCase: CreateProfessionalProfileUseCase;
  let professionalProfileRepository: any;
  let findUserByIdUseCase: any;

  const userId = 'user-uuid';
  const mockProfile: ProfessionalProfileEntity = {
    id: 'profile-uuid',
    userId,
    displayName: 'João Silva',
    bio: null,
    avatarUrl: 'https://example.com/avatar.jpg',
    professionalType: ProfessionalType.BARBER,
    bookingMode: BookingMode.DIRECT_BOOKING,
    whatsappNumber: '5511999999999',
    instagramUsername: 'joao',
    experienceYears: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ProfessionalProfileEntity;

  const validDto: CreateProfessionalProfileDto = {
    displayName: 'João Silva',
    avatarUrl: 'https://example.com/avatar.jpg',
    professionalType: ProfessionalType.BARBER,
    experienceYears: 5,
    whatsappNumber: '+55 11 99999-9999',
    instagramUsername: '@joao',
  };

  beforeEach(async () => {
    professionalProfileRepository = {
      create: jest
        .fn<() => Promise<ProfessionalProfileEntity>>()
        .mockResolvedValue(mockProfile),
      findByUserIdNonDeleted: jest
        .fn<() => Promise<ProfessionalProfileEntity | null>>()
        .mockResolvedValue(null),
    };
    findUserByIdUseCase = {
      run: jest.fn<() => Promise<{ id: string }>>().mockResolvedValue({
        id: userId,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProfessionalProfileUseCase,
        {
          provide: PROFESSIONAL_PROFILE_REPOSITORY,
          useValue: professionalProfileRepository,
        },
        { provide: FindUserByIdUseCase, useValue: findUserByIdUseCase },
      ],
    }).compile();

    useCase = module.get(CreateProfessionalProfileUseCase);
  });

  it('cria perfil quando usuário existe e não tem perfil', async () => {
    const result = await useCase.run(userId, validDto);
    expect(findUserByIdUseCase.run).toHaveBeenCalledWith(userId);
    expect(professionalProfileRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        displayName: 'João Silva',
        whatsappNumber: '5511999999999',
        instagramUsername: 'joao',
      }),
    );
    expect(result).toEqual(mockProfile);
  });

  it('lança quando usuário não existe', async () => {
    findUserByIdUseCase.run.mockRejectedValue(
      new NotFoundException('User not found'),
    );
    await expect(useCase.run(userId, validDto)).rejects.toThrow(
      NotFoundException,
    );
    expect(professionalProfileRepository.create).not.toHaveBeenCalled();
  });

  it('lança PROFESSIONAL_PROFILE_ALREADY_EXISTS', async () => {
    professionalProfileRepository.findByUserIdNonDeleted.mockResolvedValue(
      mockProfile,
    );
    await expect(useCase.run(userId, validDto)).rejects.toThrow(
      BusinessRuleException,
    );
  });

  it('lança INVALID_WHATSAPP_NUMBER', async () => {
    await expect(
      useCase.run(userId, { ...validDto, whatsappNumber: '123' }),
    ).rejects.toThrow(BusinessRuleException);
  });
});
