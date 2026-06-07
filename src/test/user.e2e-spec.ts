import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from '../modules/user/user.controller';
import { FindUserByIdUseCase } from '../modules/user/use-cases/find-user-by-id.use-case';
import { FindUserByEmailUseCase } from '../modules/user/use-cases/find-user-by-email.use-case';
import { CreateUserUseCase } from '../modules/user/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../modules/user/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../modules/user/use-cases/delete-user.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { UserRolesGuard } from '../common/guards/user-roles.guard';
import { Role } from '../common/enums/role.enum';
import { UserStatus } from '../modules/user/entities/user-status.enum';
import { ProfessionalType } from '../modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from '../modules/professional-profile/entities/booking-mode.enum';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let findByIdUseCase: jest.Mocked<FindUserByIdUseCase>;

  const mockUser = {
    id: 'user-e2e-uuid',
    firebaseUid: 'firebase-uid',
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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: FindUserByEmailUseCase, useValue: { run: jest.fn() } },
        { provide: FindUserByIdUseCase, useValue: { run: jest.fn() } },
        { provide: CreateUserUseCase, useValue: { run: jest.fn() } },
        { provide: UpdateUserUseCase, useValue: { run: jest.fn() } },
        { provide: DeleteUserUseCase, useValue: { run: jest.fn() } },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          const req = context.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string; role: Role } };
          };
          req.user = {
            dbUser: { id: 'user-e2e-uuid', role: Role.ADMIN },
          };
          return true;
        },
      })
      .overrideGuard(UserRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    findByIdUseCase = moduleFixture.get(
      FindUserByIdUseCase,
    ) as jest.Mocked<FindUserByIdUseCase>;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /users/me', () => {
    it('retorna professionalProfile null para cliente', () => {
      findByIdUseCase.run.mockResolvedValue(mockUser);
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(200)
        .expect((res) => {
          expect(res.body.professionalProfile).toBeNull();
        });
    });

    it('retorna professionalProfile quando profissional', () => {
      findByIdUseCase.run.mockResolvedValue({
        ...mockUser,
        professionalProfile: {
          id: 'pp-uuid',
          userId: mockUser.id,
          displayName: 'João Pro',
          bio: null,
          avatarUrl: 'https://example.com/a.jpg',
          professionalType: ProfessionalType.BARBER,
          bookingMode: BookingMode.DIRECT_BOOKING,
          whatsappNumber: null,
          instagramUsername: null,
          experienceYears: 1,
          isActive: true,
          createdAt: new Date('2021-01-01'),
          updatedAt: new Date('2021-01-01'),
        },
      });
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(200)
        .expect((res) => {
          expect(res.body.professionalProfile.id).toBe('pp-uuid');
        });
    });
  });

  describe('GET /users/:id', () => {
    it('inclui professionalProfile na resposta', () => {
      findByIdUseCase.run.mockResolvedValue(mockUser);
      return request(app.getHttpServer())
        .get('/users/user-e2e-uuid')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('professionalProfile');
        });
    });
  });
});
