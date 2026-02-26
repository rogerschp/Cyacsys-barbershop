import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { UserSyncService } from 'src/modules/user/user-sync.service';
import { USER_REPOSITORY } from 'src/modules/user/interfaces/user-repository.interface';
import { PASSWORD_HASHER } from 'src/common/interfaces/password-hasher.interface';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserStatus } from 'src/modules/user/entities/user-status.enum';
import { Role } from 'src/common/enums/role.enum';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<{ [key: string]: jest.Mock }>;
  let passwordHasher: jest.Mocked<{ hash: jest.Mock; compare: jest.Mock }>;
  let userSyncService: jest.Mocked<UserSyncService>;

  const mockUser: UserEntity = {
    id: 'uuid-123',
    firebaseUid: 'firebase-uid-1',
    email: 'user@email.com',
    name: 'João Silva',
    passwordHash: '$2a$10$hash',
    status: UserStatus.ACTIVE,
    role: Role.CLIENT,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    const mockRepo = {
      findByFirebaseUid: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      setFirebaseUid: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockPasswordHasher = {
      hash: jest.fn().mockResolvedValue('$2a$10$hashed'),
      compare: jest.fn().mockResolvedValue(true),
    };

    const mockUserSyncService = {
      syncFromFirebase: jest.fn(),
      syncToFirebase: jest.fn(),
      createInFirebase: jest
        .fn()
        .mockResolvedValue({ uid: 'new-firebase-uid' }),
      disableInFirebase: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: mockRepo },
        { provide: PASSWORD_HASHER, useValue: mockPasswordHasher },
        { provide: UserSyncService, useValue: mockUserSyncService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get(USER_REPOSITORY) as any;
    passwordHasher = module.get(PASSWORD_HASHER) as any;
    userSyncService = module.get(
      UserSyncService,
    ) as jest.Mocked<UserSyncService>;
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findByFirebaseUid', () => {
    it('deve retornar o usuário quando o firebaseUid existe', async () => {
      repo.findByFirebaseUid.mockResolvedValue(mockUser);

      const result = await service.findByFirebaseUid('firebase-uid-1');

      expect(repo.findByFirebaseUid).toHaveBeenCalledWith('firebase-uid-1');
      expect(result).toEqual(mockUser);
    });

    it('deve retornar null quando o firebaseUid não existe', async () => {
      repo.findByFirebaseUid.mockResolvedValue(null);

      const result = await service.findByFirebaseUid('uid-inexistente');

      expect(result).toBeNull();
    });
  });

  describe('validateUserExists', () => {
    it('deve retornar o usuário quando existe e está ACTIVE', async () => {
      repo.findByFirebaseUid.mockResolvedValue(mockUser);

      const result = await service.validateUserExists('firebase-uid-1');

      expect(result).toEqual(mockUser);
    });

    it('deve lançar UnauthorizedException quando o usuário não existe no banco', async () => {
      repo.findByFirebaseUid.mockResolvedValue(null);

      await expect(
        service.validateUserExists('uid-inexistente'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar ForbiddenException quando o usuário não está ACTIVE', async () => {
      repo.findByFirebaseUid.mockResolvedValue({
        ...mockUser,
        status: UserStatus.INACTIVE,
      });

      await expect(
        service.validateUserExists('firebase-uid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('syncUserWithFirebase', () => {
    it('deve delegar para userSyncService.syncFromFirebase', async () => {
      userSyncService.syncFromFirebase.mockResolvedValue(mockUser);

      const result = await service.syncUserWithFirebase('firebase-uid-1');

      expect(userSyncService.syncFromFirebase).toHaveBeenCalledWith(
        'firebase-uid-1',
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('deve retornar o usuário quando o email existe', async () => {
      repo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('user@email.com');

      expect(repo.findByEmail).toHaveBeenCalledWith('user@email.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('deve retornar o usuário quando o id existe', async () => {
      repo.findById.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-123');

      expect(repo.findById).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException quando o id não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('deve lançar ConflictException quando o email já existe', async () => {
      repo.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.create({
          email: 'user@email.com',
          name: 'João',
          password: 'senha123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repo.findByEmail).toHaveBeenCalledWith('user@email.com');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve criar usuário, hashear senha, sync Firebase e setar firebaseUid', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ ...mockUser, firebaseUid: null });
      repo.findById.mockResolvedValue({
        ...mockUser,
        firebaseUid: 'new-firebase-uid',
      });

      const result = await service.create({
        email: 'novo@email.com',
        name: 'Novo User',
        password: 'senha123',
      });

      expect(passwordHasher.hash).toHaveBeenCalledWith('senha123');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'novo@email.com',
          name: 'Novo User',
          passwordHash: '$2a$10$hashed',
        }),
      );
      expect(userSyncService.createInFirebase).toHaveBeenCalledWith({
        email: 'novo@email.com',
        password: 'senha123',
        displayName: 'Novo User',
      });
      expect(repo.setFirebaseUid).toHaveBeenCalledWith(
        'uuid-123',
        'new-firebase-uid',
      );
      expect(result).toBeDefined();
      expect(result?.firebaseUid).toBe('new-firebase-uid');
    });

    it('deve fazer soft delete do usuário criado se createInFirebase falhar', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ ...mockUser, firebaseUid: null });
      userSyncService.createInFirebase.mockRejectedValue(
        new Error('Firebase error'),
      );

      await expect(
        service.create({
          email: 'novo@email.com',
          name: 'Novo User',
          password: 'senha123',
        }),
      ).rejects.toThrow('Firebase error');

      expect(repo.softDelete).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('update', () => {
    it('deve lançar NotFoundException quando o usuário não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('id-inexistente', { name: 'Nome' }),
      ).rejects.toThrow(NotFoundException);

      expect(repo.update).not.toHaveBeenCalled();
    });

    it('deve atualizar no banco e sincronizar no Firebase quando usuário tem firebaseUid', async () => {
      repo.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, name: 'Nome Atualizado' });

      const result = await service.update('uuid-123', {
        name: 'Nome Atualizado',
      });

      expect(repo.update).toHaveBeenCalledWith('uuid-123', {
        name: 'Nome Atualizado',
      });
      expect(userSyncService.syncToFirebase).toHaveBeenCalledWith(
        'firebase-uid-1',
        { displayName: 'Nome Atualizado' },
      );
      expect(result?.name).toBe('Nome Atualizado');
    });

    it('deve hashear nova senha quando password é informado', async () => {
      repo.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);

      await service.update('uuid-123', { password: 'novaSenha123' });

      expect(passwordHasher.hash).toHaveBeenCalledWith('novaSenha123');
      expect(repo.update).toHaveBeenCalledWith(
        'uuid-123',
        expect.objectContaining({
          passwordHash: '$2a$10$hashed',
        }),
      );
    });
  });

  describe('delete', () => {
    it('deve lançar NotFoundException quando o usuário não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );

      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('deve chamar disableInFirebase e softDelete quando usuário tem firebaseUid', async () => {
      repo.findById.mockResolvedValue(mockUser);

      await service.delete('uuid-123');

      expect(userSyncService.disableInFirebase).toHaveBeenCalledWith(
        'firebase-uid-1',
      );
      expect(repo.softDelete).toHaveBeenCalledWith('uuid-123');
    });

    it('deve apenas soft delete quando usuário não tem firebaseUid', async () => {
      repo.findById.mockResolvedValue({ ...mockUser, firebaseUid: null });

      await service.delete('uuid-123');

      expect(userSyncService.disableInFirebase).not.toHaveBeenCalled();
      expect(repo.softDelete).toHaveBeenCalledWith('uuid-123');
    });
  });
});
