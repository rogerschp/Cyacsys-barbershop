import { Test } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import request = require('supertest');
import { UserController } from 'src/modules/user/user.controller';
import { CreateUserUseCase } from 'src/modules/user/use-cases/create-user.use-case';
import { DeleteUserUseCase } from 'src/modules/user/use-cases/delete-user.use-case';
import { FindUserByEmailUseCase } from 'src/modules/user/use-cases/find-user-by-email.use-case';
import { FindUserByIdUseCase } from 'src/modules/user/use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from 'src/modules/user/use-cases/update-user.use-case';
import { UserStatus } from 'src/modules/user/entities/user-status.enum';
import { Role } from 'src/common/enums/role.enum';
import { ConflictException } from '@nestjs/common';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { UserRolesGuard } from 'src/common/guards/user-roles.guard';

describe('UserController (HTTP)', () => {
  let app: INestApplication;
  let adminApp: INestApplication;
  let meApp: INestApplication;

  const useCases = {
    findUserByEmailUseCase: { run: jest.fn() },
    findUserByIdUseCase: { run: jest.fn() },
    createUserUseCase: { run: jest.fn() },
    updateUserUseCase: { run: jest.fn() },
    deleteUserUseCase: { run: jest.fn() },
  };

  const mockUserResponse = {
    id: 'uuid-123',
    firebaseUid: 'firebase-uid-1',
    email: 'user@email.com',
    name: 'João Silva',
    status: UserStatus.ACTIVE,
    role: Role.CLIENT,
    telephone: '5511999999999',
    address: null,
    professionalProfile: null,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
  };

  const registerPayload = {
    email: 'user@email.com',
    name: 'João Silva',
    password: 'senha123',
    telephone: '5511999999999',
  };

  beforeAll(async () => {
    const baseProviders = [
      {
        provide: FindUserByEmailUseCase,
        useValue: useCases.findUserByEmailUseCase,
      },
      {
        provide: FindUserByIdUseCase,
        useValue: useCases.findUserByIdUseCase,
      },
      { provide: CreateUserUseCase, useValue: useCases.createUserUseCase },
      { provide: UpdateUserUseCase, useValue: useCases.updateUserUseCase },
      { provide: DeleteUserUseCase, useValue: useCases.deleteUserUseCase },
    ];

    const publicModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: baseProviders,
    }).compile();
    app = publicModule.createNestApplication();
    await app.init();

    const adminModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: baseProviders,
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            dbUser: { id: 'admin-uuid', role: Role.ADMIN },
            uid: 'firebase-admin',
          };
          return true;
        },
      })
      .overrideGuard(UserRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    adminApp = adminModule.createNestApplication();
    await adminApp.init();

    const meModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: baseProviders,
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'uuid-123' }, uid: 'firebase-uid' };
          return true;
        },
      })
      .compile();
    meApp = meModule.createNestApplication();
    await meApp.init();
  });

  afterAll(async () => {
    await app.close();
    await adminApp.close();
    await meApp.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/by-email', () => {
    it('deve retornar 200 e o usuário quando o email existe', () => {
      useCases.findUserByEmailUseCase.run.mockResolvedValue(mockUserResponse);
      return request(adminApp.getHttpServer())
        .get('/users/by-email')
        .query({ email: 'user@email.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(res.body).toHaveProperty('email', 'user@email.com');
          expect(res.body).toHaveProperty('name', 'João Silva');
          expect(useCases.findUserByEmailUseCase.run).toHaveBeenCalledWith(
            'user@email.com',
          );
        });
    });

    it('deve retornar 404 quando o email não existe', () => {
      useCases.findUserByEmailUseCase.run.mockResolvedValue(null);
      return request(adminApp.getHttpServer())
        .get('/users/by-email')
        .query({ email: 'inexistente@email.com' })
        .expect(404);
    });
  });

  describe('POST /users', () => {
    it('deve retornar 201 e o usuário criado sem autenticação', () => {
      useCases.createUserUseCase.run.mockResolvedValue(mockUserResponse);
      return request(app.getHttpServer())
        .post('/users')
        .send(registerPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(res.body).toHaveProperty('email', 'user@email.com');
          expect(res.body).toHaveProperty('name', 'João Silva');
          expect(useCases.createUserUseCase.run).toHaveBeenCalledWith(
            registerPayload,
          );
        });
    });

    it('deve retornar 409 quando o email já está em uso', () => {
      useCases.createUserUseCase.run.mockRejectedValue(
        new ConflictException('Email already in use'),
      );
      return request(app.getHttpServer())
        .post('/users')
        .send({
          ...registerPayload,
          email: 'existente@email.com',
          name: 'User',
        })
        .expect(409);
    });
  });

  describe('GET /users/me', () => {
    it('retorna 200 com professionalProfile quando existir', () => {
      useCases.findUserByIdUseCase.run.mockResolvedValue({
        ...mockUserResponse,
        professionalProfile: {
          id: 'pp-uuid',
          userId: 'uuid-123',
          displayName: 'João Pro',
          isActive: true,
        },
      });

      return request(meApp.getHttpServer())
        .get('/users/me')
        .expect(200)
        .expect((res) => {
          expect(res.body.professionalProfile).toMatchObject({
            id: 'pp-uuid',
            displayName: 'João Pro',
          });
          expect(useCases.findUserByIdUseCase.run).toHaveBeenCalledWith(
            'uuid-123',
          );
        });
    });
  });

  describe('PATCH /users/me', () => {
    it('deve retornar 200 e o usuário atualizado', () => {
      const updated = { ...mockUserResponse, name: 'Nome Atualizado' };
      useCases.updateUserUseCase.run.mockResolvedValue(updated);

      return request(meApp.getHttpServer())
        .patch('/users/me')
        .send({ name: 'Nome Atualizado' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Nome Atualizado');
          expect(useCases.updateUserUseCase.run).toHaveBeenCalledWith(
            'uuid-123',
            { name: 'Nome Atualizado' },
          );
        });
    });
  });

  describe('GET /users/:id', () => {
    it('deve retornar 200 e o usuário quando o id existe', () => {
      useCases.findUserByIdUseCase.run.mockResolvedValue(mockUserResponse);
      return request(adminApp.getHttpServer())
        .get('/users/uuid-123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(res.body).toHaveProperty('email', 'user@email.com');
          expect(useCases.findUserByIdUseCase.run).toHaveBeenCalledWith(
            'uuid-123',
          );
        });
    });

    it('deve retornar 404 quando o id não existe', () => {
      useCases.findUserByIdUseCase.run.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      return request(adminApp.getHttpServer())
        .get('/users/id-inexistente')
        .expect(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('deve retornar 200 e o usuário atualizado', () => {
      const updated = { ...mockUserResponse, name: 'Nome Atualizado' };
      useCases.updateUserUseCase.run.mockResolvedValue(updated);
      return request(adminApp.getHttpServer())
        .patch('/users/uuid-123')
        .send({ name: 'Nome Atualizado' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Nome Atualizado');
          expect(useCases.updateUserUseCase.run).toHaveBeenCalledWith(
            'uuid-123',
            { name: 'Nome Atualizado' },
          );
        });
    });

    it('deve retornar 404 quando o id não existe', () => {
      useCases.updateUserUseCase.run.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      return request(adminApp.getHttpServer())
        .patch('/users/id-inexistente')
        .send({ name: 'Nome' })
        .expect(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('deve retornar 200 ao remover o usuário', async () => {
      useCases.deleteUserUseCase.run.mockResolvedValue(undefined);
      await request(adminApp.getHttpServer())
        .delete('/users/uuid-123')
        .expect(200);
      expect(useCases.deleteUserUseCase.run).toHaveBeenCalledWith('uuid-123');
    });

    it('deve retornar 404 quando o id não existe', () => {
      useCases.deleteUserUseCase.run.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      return request(adminApp.getHttpServer())
        .delete('/users/id-inexistente')
        .expect(404);
    });
  });
});
