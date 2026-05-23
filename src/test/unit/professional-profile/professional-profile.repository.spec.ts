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
    typeOrmRepo.create.mockReturnValue(
      mockProfile as ProfessionalProfileEntity,
    );
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
        bio: null,
        whatsappNumber: null,
        instagramUsername: null,
      }),
    );
  });

  it('create persiste bookingMode e contatos quando informados', async () => {
    typeOrmRepo.create.mockReturnValue(
      mockProfile as ProfessionalProfileEntity,
    );
    typeOrmRepo.save.mockResolvedValue(mockProfile);

    await repository.create({
      userId,
      displayName: 'João',
      avatarUrl: 'https://example.com/a.jpg',
      professionalType: ProfessionalType.TATTOO_ARTIST,
      experienceYears: 3,
      bookingMode: BookingMode.WHATSAPP_ONLY,
      bio: 'Bio',
      whatsappNumber: '5511999999999',
      instagramUsername: 'joao',
    });

    expect(typeOrmRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingMode: BookingMode.WHATSAPP_ONLY,
        bio: 'Bio',
        whatsappNumber: '5511999999999',
        instagramUsername: 'joao',
      }),
    );
  });

  it('findById retorna perfil não deletado', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockProfile);
    const result = await repository.findById(profileId);
    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { id: profileId },
      withDeleted: false,
    });
    expect(result).toBe(mockProfile);
  });

  it('findByUserIdNonDeleted usa query builder', async () => {
    mockQueryBuilder.getOne.mockResolvedValue(mockProfile);
    const result = await repository.findByUserIdNonDeleted(userId);
    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'pp.user_id = :userId',
      {
        userId,
      },
    );
    expect(result).toBe(mockProfile);
  });

  it('update aplica campos parciais e recarrega', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockProfile);

    await repository.update(profileId, userId, {
      displayName: 'Novo',
      bookingMode: BookingMode.QUOTE_REQUIRED,
      isActive: false,
    });

    expect(typeOrmRepo.update).toHaveBeenCalledWith(
      { id: profileId, userId },
      {
        displayName: 'Novo',
        bookingMode: BookingMode.QUOTE_REQUIRED,
        isActive: false,
      },
    );
  });

  it('update lança erro quando perfil não é encontrado após update', async () => {
    typeOrmRepo.findOne.mockResolvedValue(null);

    await expect(
      repository.update(profileId, userId, { displayName: 'X' }),
    ).rejects.toThrow('Professional profile not found after update');
  });
});
