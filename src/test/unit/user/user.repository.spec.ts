import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from 'src/repository/user/user.repository';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserStatus } from 'src/modules/user/entities/user-status.enum';
import { Role } from 'src/common/enums/role.enum';
describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepo: jest.Mocked<Repository<UserEntity>>;
  const mockUser: UserEntity = {
    id: 'uuid-123',
    firebaseUid: 'firebase-uid-1',
    email: 'user@email.com',
    name: 'João Silva',
    passwordHash: '$2a$10$hash',
    status: UserStatus.ACTIVE,
    role: Role.CLIENT,
    telephone: '5511999999999',
    addressId: null,
    address: null,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };
  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();
    repository = module.get<UserRepository>(UserRepository);
    typeOrmRepo = module.get(getRepositoryToken(UserEntity)) as jest.Mocked<
      Repository<UserEntity>
    >;
  });
  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });
  describe('findByFirebaseUid', () => {
    it('deve retornar o usuário quando o firebaseUid existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockUser);
      const result = await repository.findByFirebaseUid('firebase-uid-1');
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { firebaseUid: 'firebase-uid-1' },
      });
      expect(result).toEqual(mockUser);
    });
    it('deve retornar null quando o firebaseUid não existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByFirebaseUid('uid-inexistente');
      expect(result).toBeNull();
    });
  });
  describe('findByEmail', () => {
    it('deve retornar o usuário quando o email existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockUser);
      const result = await repository.findByEmail('user@email.com');
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'user@email.com' },
        relations: ['address'],
      });
      expect(result).toEqual(mockUser);
    });
    it('deve retornar null quando o email não existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findByEmail('outro@email.com');
      expect(result).toBeNull();
    });
  });
  describe('findById', () => {
    it('deve retornar o usuário quando o id existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockUser);
      const result = await repository.findById('uuid-123');
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        relations: ['address'],
      });
      expect(result).toEqual(mockUser);
    });
    it('deve retornar null quando o id não existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById('id-inexistente');
      expect(result).toBeNull();
    });
  });
  describe('create', () => {
    it('deve criar e salvar o usuário com status ACTIVE e role CLIENT por padrão', async () => {
      const dto = {
        email: 'user@email.com',
        name: 'João Silva',
        passwordHash: '$2a$10$hash',
        telephone: '5511999999999',
        addressId: null,
        address: null,
      };
      typeOrmRepo.create.mockReturnValue(mockUser as any);
      typeOrmRepo.save.mockResolvedValue(mockUser);
      const result = await repository.create(dto);
      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        ...dto,
        firebaseUid: null,
        status: UserStatus.ACTIVE,
        role: Role.CLIENT,
      });
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
  describe('update', () => {
    it('deve salvar o usuário com id e dados parciais', async () => {
      const data = { name: 'Nome Atualizado' };
      typeOrmRepo.save.mockResolvedValue(undefined as any);
      await repository.update('uuid-123', data);
      expect(typeOrmRepo.save).toHaveBeenCalledWith({
        id: 'uuid-123',
        ...data,
      });
    });
  });
  describe('setFirebaseUid', () => {
    it('deve chamar update com firebaseUid', async () => {
      typeOrmRepo.update.mockResolvedValue({ affected: 1 } as any);
      await repository.setFirebaseUid('uuid-123', 'new-firebase-uid');
      expect(typeOrmRepo.update).toHaveBeenCalledWith('uuid-123', {
        firebaseUid: 'new-firebase-uid',
      });
    });
  });
  describe('softDelete', () => {
    it('deve chamar softDelete do repositório', async () => {
      typeOrmRepo.softDelete.mockResolvedValue({ affected: 1 } as any);
      await repository.softDelete('uuid-123');
      expect(typeOrmRepo.softDelete).toHaveBeenCalledWith('uuid-123');
    });
  });
});
