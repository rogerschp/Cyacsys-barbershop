import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from 'src/modules/user/user.controller';
import { UserService } from 'src/modules/user/user.service';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { UserStatus } from 'src/modules/user/entities/user-status.enum';
import { Role } from 'src/common/enums/role.enum';
import { ConflictException } from '@nestjs/common';
describe('UserController (HTTP)', () => {
    let app: INestApplication;
    let userService: jest.Mocked<UserService>;
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
    beforeAll(async () => {
        const mockService = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: mockService,
                },
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        userService = moduleFixture.get(UserService) as jest.Mocked<UserService>;
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /users/by-email', () => {
        it('deve retornar 200 e o usuário quando o email existe', () => {
            userService.findByEmail.mockResolvedValue(mockUser);
            return request(app.getHttpServer())
                .get('/users/by-email')
                .query({ email: 'user@email.com' })
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', 'uuid-123');
                expect(res.body).toHaveProperty('email', 'user@email.com');
                expect(res.body).toHaveProperty('name', 'João Silva');
                expect(userService.findByEmail).toHaveBeenCalledWith('user@email.com');
            });
        });
        it('deve retornar 404 quando o email não existe', () => {
            userService.findByEmail.mockResolvedValue(null);
            return request(app.getHttpServer())
                .get('/users/by-email')
                .query({ email: 'inexistente@email.com' })
                .expect(404);
        });
    });
    describe('POST /users', () => {
        it('deve retornar 201 e o usuário criado', () => {
            userService.create.mockResolvedValue(mockUser);
            return request(app.getHttpServer())
                .post('/users')
                .send({
                email: 'user@email.com',
                name: 'João Silva',
                password: 'senha123',
            })
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', 'uuid-123');
                expect(res.body).toHaveProperty('email', 'user@email.com');
                expect(res.body).toHaveProperty('name', 'João Silva');
                expect(userService.create).toHaveBeenCalledWith({
                    email: 'user@email.com',
                    name: 'João Silva',
                    password: 'senha123',
                });
            });
        });
        it('deve retornar 409 quando o email já está em uso', () => {
            userService.create.mockRejectedValue(new ConflictException('Email already in use'));
            return request(app.getHttpServer())
                .post('/users')
                .send({
                email: 'existente@email.com',
                name: 'User',
                password: 'senha123',
            })
                .expect(409);
        });
    });
    describe('GET /users/:id', () => {
        it('deve retornar 200 e o usuário quando o id existe', () => {
            userService.findById.mockResolvedValue(mockUser);
            return request(app.getHttpServer())
                .get('/users/uuid-123')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', 'uuid-123');
                expect(res.body).toHaveProperty('email', 'user@email.com');
                expect(userService.findById).toHaveBeenCalledWith('uuid-123');
            });
        });
        it('deve retornar 404 quando o id não existe', () => {
            userService.findById.mockRejectedValue(new NotFoundException('User not found'));
            return request(app.getHttpServer())
                .get('/users/id-inexistente')
                .expect(404);
        });
    });
    describe('PATCH /users/:id', () => {
        it('deve retornar 200 e o usuário atualizado', () => {
            const updated = { ...mockUser, name: 'Nome Atualizado' };
            userService.update.mockResolvedValue(updated);
            return request(app.getHttpServer())
                .patch('/users/uuid-123')
                .send({ name: 'Nome Atualizado' })
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('name', 'Nome Atualizado');
                expect(userService.update).toHaveBeenCalledWith('uuid-123', {
                    name: 'Nome Atualizado',
                });
            });
        });
        it('deve retornar 404 quando o id não existe', () => {
            userService.update.mockRejectedValue(new NotFoundException('User not found'));
            return request(app.getHttpServer())
                .patch('/users/id-inexistente')
                .send({ name: 'Nome' })
                .expect(404);
        });
    });
    describe('DELETE /users/:id', () => {
        it('deve retornar 200 ao remover o usuário', async () => {
            userService.delete.mockResolvedValue(undefined);
            await request(app.getHttpServer()).delete('/users/uuid-123').expect(200);
            expect(userService.delete).toHaveBeenCalledWith('uuid-123');
        });
        it('deve retornar 404 quando o id não existe', () => {
            userService.delete.mockRejectedValue(new NotFoundException('User not found'));
            return request(app.getHttpServer())
                .delete('/users/id-inexistente')
                .expect(404);
        });
    });
});
