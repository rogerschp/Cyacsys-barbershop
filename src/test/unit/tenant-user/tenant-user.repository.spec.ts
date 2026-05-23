import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantUserRepository } from 'src/repository/tenant-user/tenant-user.repository';
import { TenantUserEntity } from 'src/modules/tenant-user/entities/tenant-user.entity';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';
describe('TenantUserRepository', () => {
  let repository: TenantUserRepository;
  let typeOrmRepo: jest.Mocked<Repository<TenantUserEntity>>;
  const mockLink: TenantUserEntity = {
    id: 'uuid-link-1',
    tenantId: 'tenant-uuid',
    userId: 'user-uuid',
    role: TenantUserRole.BARBER,
    status: TenantUserStatus.ACTIVE,
    createdAt: new Date('2021-01-01'),
  } as TenantUserEntity;
  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantUserRepository,
        {
          provide: getRepositoryToken(TenantUserEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();
    repository = module.get<TenantUserRepository>(TenantUserRepository);
    typeOrmRepo = module.get(
      getRepositoryToken(TenantUserEntity),
    ) as jest.Mocked<Repository<TenantUserEntity>>;
  });
  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });
  describe('create', () => {
    it('deve criar e retornar o vinculo tenant-user', async () => {
      typeOrmRepo.create.mockReturnValue(mockLink as TenantUserEntity);
      typeOrmRepo.save.mockResolvedValue(mockLink as TenantUserEntity);
      const result = await repository.create({
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
        role: TenantUserRole.OWNER,
      });
      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
        role: TenantUserRole.OWNER,
        status: TenantUserStatus.ACTIVE,
      });
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockLink);
      expect(result).toEqual(mockLink);
    });
  });
  describe('findByTenantAndUser', () => {
    it('deve retornar o vinculo quando existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockLink as TenantUserEntity);
      const result = await repository.findByTenantAndUser(
        'tenant-uuid',
        'user-uuid',
      );
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid', userId: 'user-uuid' },
      });
      expect(result).toEqual(mockLink);
    });
    it('deve retornar null quando nao existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByTenantAndUser('t', 'u');
      expect(result).toBeNull();
    });
  });
  describe('deleteByTenantAndUser', () => {
    it('deve chamar delete com tenantId e userId', async () => {
      typeOrmRepo.delete.mockResolvedValue({ affected: 1 } as any);
      await repository.deleteByTenantAndUser('tenant-uuid', 'user-uuid');
      expect(typeOrmRepo.delete).toHaveBeenCalledWith({
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
      });
    });
  });
});
