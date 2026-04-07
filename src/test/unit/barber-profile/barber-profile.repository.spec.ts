import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarberProfileRepository } from 'src/repository/barber-profile/barber-profile.repository';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';

describe('BarberProfileRepository', () => {
  let repository: BarberProfileRepository;
  let typeOrmRepo: jest.Mocked<Repository<BarberProfileEntity>>;

  const tenantId = 'tenant-uuid';
  const profileId = 'profile-uuid';
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
      find: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BarberProfileRepository,
        {
          provide: getRepositoryToken(BarberProfileEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<BarberProfileRepository>(BarberProfileRepository);
    typeOrmRepo = module.get(
      getRepositoryToken(BarberProfileEntity),
    ) as jest.Mocked<Repository<BarberProfileEntity>>;
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('deve criar e salvar perfil com isActive true', async () => {
      const data = {
        tenantId,
        tenantUserId: 'tenant-user-uuid',
        displayName: 'João Barbeiro',
        bio: null,
        avatarUrl: 'https://example.com/avatar.jpg',
        experienceYears: 5,
      };
      typeOrmRepo.create.mockReturnValue(mockProfile as any);
      typeOrmRepo.save.mockResolvedValue(mockProfile);

      const result = await repository.create(data);

      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        ...data,
        isActive: true,
      });
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockProfile);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('findById', () => {
    it('deve retornar perfil quando existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockProfile);

      const result = await repository.findById(profileId, tenantId);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: profileId, tenantId },
        withDeleted: false,
      });
      expect(result).toEqual(mockProfile);
    });

    it('deve retornar null quando não existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(profileId, tenantId);

      expect(result).toBeNull();
    });
  });

  describe('findByTenantUserIdNonDeleted', () => {
    it('deve retornar perfil quando existe', async () => {
      const tenantUserId = 'tenant-user-uuid';
      mockQueryBuilder.getOne.mockResolvedValue(mockProfile);

      const result = await repository.findByTenantUserIdNonDeleted(
        tenantId,
        tenantUserId,
      );

      expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('bp');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'bp.tenant_id = :tenantId',
        { tenantId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'bp.tenant_user_id = :tenantUserId',
        { tenantUserId },
      );
      expect(result).toEqual(mockProfile);
    });
  });

  describe('listByTenant', () => {
    it('deve retornar lista ordenada por displayName', async () => {
      typeOrmRepo.find.mockResolvedValue([mockProfile]);

      const result = await repository.listByTenant(tenantId);

      expect(typeOrmRepo.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { displayName: 'ASC' },
        withDeleted: false,
      });
      expect(result).toEqual([mockProfile]);
    });
  });

  describe('update', () => {
    it('deve atualizar e retornar entidade', async () => {
      typeOrmRepo.findOne.mockResolvedValue({
        ...mockProfile,
        displayName: 'Nome Novo',
      });

      const result = await repository.update(profileId, tenantId, {
        displayName: 'Nome Novo',
      });

      expect(typeOrmRepo.update).toHaveBeenCalledWith(
        { id: profileId, tenantId },
        { displayName: 'Nome Novo' },
      );
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: profileId, tenantId },
        withDeleted: false,
      });
      expect(result.displayName).toBe('Nome Novo');
    });
  });

  describe('softDelete', () => {
    it('deve soft delete e retornar entidade', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockProfile);

      const result = await repository.softDelete(profileId, tenantId);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: profileId, tenantId },
        withDeleted: false,
      });
      expect(typeOrmRepo.softDelete).toHaveBeenCalledWith({
        id: profileId,
        tenantId,
      });
      expect(result).toEqual(mockProfile);
    });
  });
});
