import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { AuthLoginDto } from 'src/modules/auth/dto/auth-login.dto';
import { ForbiddenException } from '@nestjs/common';
describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<AuthService>;
  const mockLoginResponse = {
    idToken: 'id-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 3600,
  };
  beforeAll(async () => {
    const mockService = {
      authenticateWithUserCredentials: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { uid: 'firebase-uid-1', dbUser: { id: 'user-uuid' } };
          return true;
        },
      })
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    authService = moduleFixture.get(AuthService) as jest.Mocked<AuthService>;
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('POST /auth/login', () => {
    it('deve retornar 201 e tokens quando credenciais validas', () => {
      authService.authenticateWithUserCredentials.mockResolvedValue(
        mockLoginResponse,
      );
      const dto: AuthLoginDto = {
        email: 'user@email.com',
        password: 'senha123',
      };
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('idToken', mockLoginResponse.idToken);
          expect(res.body).toHaveProperty(
            'refreshToken',
            mockLoginResponse.refreshToken,
          );
          expect(
            authService.authenticateWithUserCredentials,
          ).toHaveBeenCalledWith(dto);
        });
    });
    it('deve retornar 403 quando usuario nao existe no banco ou inativo', () => {
      authService.authenticateWithUserCredentials.mockRejectedValue(
        new ForbiddenException('User not found in database'),
      );
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@email.com', password: 'senha123' })
        .expect(403);
    });
  });
  describe('POST /auth/refresh', () => {
    it('deve retornar 200 e novos tokens', () => {
      authService.refreshToken.mockResolvedValue(mockLoginResponse);
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'refresh-123' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('idToken');
          expect(authService.refreshToken).toHaveBeenCalledWith({
            refreshToken: 'refresh-123',
          });
        });
    });
  });
  describe('POST /auth/logout', () => {
    it('deve retornar 200 e mensagem de sucesso', async () => {
      authService.logout.mockResolvedValue(undefined);
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer fake-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Logged out successfully');
        });
      expect(authService.logout).toHaveBeenCalledWith('firebase-uid-1');
    });
  });
});
