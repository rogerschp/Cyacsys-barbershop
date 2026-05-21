import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindUserByIdUseCase } from 'src/modules/user/use-cases/find-user-by-id.use-case';
import { USER_REPOSITORY } from 'src/modules/user/interfaces/user-repository.interface';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { UserStatus } from 'src/modules/user/entities/user-status.enum';
import { Role } from 'src/common/enums/role.enum';

describe('FindUserByIdUseCase', () => {
  let useCase: FindUserByIdUseCase;
  let userRepository: { findById: jest.Mock };

  beforeEach(async () => {
    userRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserByIdUseCase,
        { provide: USER_REPOSITORY, useValue: userRepository },
      ],
    }).compile();

    useCase = module.get(FindUserByIdUseCase);
  });

  it('inclui professionalProfile na resposta quando existir', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'user-uuid',
      firebaseUid: null,
      email: 'a@b.com',
      name: 'Nome',
      status: UserStatus.ACTIVE,
      role: Role.CLIENT,
      telephone: '5511999999999',
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      professionalProfile: {
        id: 'pp-uuid',
        userId: 'user-uuid',
        displayName: 'Pro',
        bio: null,
        avatarUrl: 'https://x.com/a.jpg',
        professionalType: ProfessionalType.BARBER,
        bookingMode: BookingMode.DIRECT_BOOKING,
        whatsappNumber: null,
        instagramUsername: null,
        experienceYears: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const result = await useCase.run('user-uuid');

    expect(result.professionalProfile).not.toBeNull();
    expect(result.professionalProfile?.id).toBe('pp-uuid');
  });

  it('retorna professionalProfile null quando usuário não tem perfil', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'user-uuid',
      firebaseUid: null,
      email: 'a@b.com',
      name: 'Nome',
      status: UserStatus.ACTIVE,
      role: Role.CLIENT,
      telephone: '5511999999999',
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.run('user-uuid');

    expect(result.professionalProfile).toBeNull();
  });

  it('lança NotFound quando usuário não existe', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(useCase.run('missing')).rejects.toThrow(NotFoundException);
  });
});
