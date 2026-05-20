import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfessionalProfileRepository } from 'src/repository/professional-profile/professional-profile.repository';
import { ProfessionalProfileEntity } from 'src/modules/professional-profile/entities/professional-profile.entity';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';

describe('ProfessionalProfileRepository', () => {
  let repository: ProfessionalProfileRepository;
  let typeOrmRepo: jest.Mocked<Repository<ProfessionalProfileEntity>>;

  const userId = 'user-uuid';
  const profileId = 'profile-uuid';
  const mockProfile = {
    id: profileId,
    userId,
    displayName: 'João',
    professionalType: ProfessionalType.BARBER,
    bookingMode: BookingMode.DIRECT_BOOKING,
    isActive: true,
  } as ProfessionalProfileEntity;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalProfileRepository,
        {
          provide: getRepositoryToken(ProfessionalProfileEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(ProfessionalProfileRepository);
    typeOrmRepo = module.get(
      getRepositoryToken(ProfessionalProfileEntity),
    ) as jest.Mocked<Repository<ProfessionalProfileEntity>>;
  });

  it('create persiste com isActive true e bookingMode default', async () => {
    typeOrmRepo.create.mockReturnValue(mockProfile as ProfessionalProfileEntity);
    typeOrmRepo.save.mockResolvedValue(mockProfile);

    await repository.create({
      userId,
      displayName: 'João',
      avatarUrl: 'https://example.com/a.jpg',
      professionalType: ProfessionalType.BARBER,
      experienceYears: 3,
    });

    expect(typeOrmRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        bookingMode: BookingMode.DIRECT_BOOKING,
        isActive: true,
      }),
    );
  });
});
