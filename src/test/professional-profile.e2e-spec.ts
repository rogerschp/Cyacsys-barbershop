import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ProfessionalProfileController } from '../modules/professional-profile/professional-profile.controller';
import { CreateProfessionalProfileUseCase } from '../modules/professional-profile/use-cases/create-professional-profile.use-case';
import { UpdateProfessionalProfileUseCase } from '../modules/professional-profile/use-cases/update-professional-profile.use-case';
import { DeactivateProfessionalProfileUseCase } from '../modules/professional-profile/use-cases/deactivate-professional-profile.use-case';
import { GetProfessionalProfileByUserUseCase } from '../modules/professional-profile/use-cases/get-professional-profile-by-user.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { ProfessionalType } from '../modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from '../modules/professional-profile/entities/booking-mode.enum';
import { ProfessionalProfileEntity } from '../modules/professional-profile/entities/professional-profile.entity';

describe('ProfessionalProfileController (e2e)', () => {
  let app: INestApplication;
  let createUseCase: jest.Mocked<CreateProfessionalProfileUseCase>;
  let updateUseCase: jest.Mocked<UpdateProfessionalProfileUseCase>;
  let deactivateUseCase: jest.Mocked<DeactivateProfessionalProfileUseCase>;
  let getUseCase: jest.Mocked<GetProfessionalProfileByUserUseCase>;

  const userId = 'user-e2e-123';
  const profileId = 'profile-e2e-uuid';

  const mockProfile: ProfessionalProfileEntity = {
    id: profileId,
    userId,
    displayName: 'João Silva',
    bio: 'Especialista',
    avatarUrl: 'https://example.com/avatar.jpg',
    professionalType: ProfessionalType.BARBER,
    bookingMode: BookingMode.DIRECT_BOOKING,
    whatsappNumber: '5511999999999',
    instagramUsername: 'joao.profissional',
    experienceYears: 5,
    isActive: true,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
  } as ProfessionalProfileEntity;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfessionalProfileController],
      providers: [
        { provide: CreateProfessionalProfileUseCase, useValue: { run: jest.fn() } },
        { provide: UpdateProfessionalProfileUseCase, useValue: { run: jest.fn() } },
        {
          provide: DeactivateProfessionalProfileUseCase,
          useValue: { run: jest.fn() },
        },
        { provide: GetProfessionalProfileByUserUseCase, useValue: { run: jest.fn() } },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          const req = context.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string } };
          };
          req.user = { dbUser: { id: userId } };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    createUseCase = moduleFixture.get(
      CreateProfessionalProfileUseCase,
    ) as jest.Mocked<CreateProfessionalProfileUseCase>;
    updateUseCase = moduleFixture.get(
      UpdateProfessionalProfileUseCase,
    ) as jest.Mocked<UpdateProfessionalProfileUseCase>;
    deactivateUseCase = moduleFixture.get(
      DeactivateProfessionalProfileUseCase,
    ) as jest.Mocked<DeactivateProfessionalProfileUseCase>;
    getUseCase = moduleFixture.get(
      GetProfessionalProfileByUserUseCase,
    ) as jest.Mocked<GetProfessionalProfileByUserUseCase>;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createUseCase.run.mockResolvedValue(mockProfile);
    updateUseCase.run.mockResolvedValue({ ...mockProfile, displayName: 'Nome Atualizado' });
    deactivateUseCase.run.mockResolvedValue({ ...mockProfile, isActive: false });
    getUseCase.run.mockResolvedValue(mockProfile);
  });

  describe('POST /users/me/professional-profile', () => {
    it('deve retornar 201 e o perfil mapeado', () => {
      return request(app.getHttpServer())
        .post('/users/me/professional-profile')
        .send({
          displayName: 'João Silva',
          avatarUrl: 'https://example.com/avatar.jpg',
          professionalType: ProfessionalType.BARBER,
          experienceYears: 5,
          whatsappNumber: '+55 11 99999-9999',
          instagramUsername: '@joao.profissional',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: profileId,
            userId,
            displayName: 'João Silva',
            professionalType: ProfessionalType.BARBER,
            bookingMode: BookingMode.DIRECT_BOOKING,
          });
          expect(createUseCase.run).toHaveBeenCalledWith(
            userId,
            expect.objectContaining({ displayName: 'João Silva' }),
          );
        });
    });

    it('deve retornar 400 quando body inválido', () => {
      return request(app.getHttpServer())
        .post('/users/me/professional-profile')
        .send({ displayName: 'João' })
        .expect(400);
    });
  });

  describe('GET /users/me/professional-profile', () => {
    it('deve retornar 200 e o perfil', () => {
      return request(app.getHttpServer())
        .get('/users/me/professional-profile')
        .expect(200)
        .expect((res) => {
          expect(res.body.userId).toBe(userId);
          expect(getUseCase.run).toHaveBeenCalledWith(userId);
        });
    });
  });

  describe('PATCH /users/me/professional-profile', () => {
    it('deve retornar 200 e o perfil atualizado', () => {
      return request(app.getHttpServer())
        .patch('/users/me/professional-profile')
        .send({ displayName: 'Nome Atualizado' })
        .expect(200)
        .expect((res) => {
          expect(res.body.displayName).toBe('Nome Atualizado');
          expect(updateUseCase.run).toHaveBeenCalledWith(
            userId,
            { displayName: 'Nome Atualizado' },
          );
        });
    });
  });

  describe('PATCH /users/me/professional-profile/deactivate', () => {
    it('deve retornar 200 com isActive false', () => {
      return request(app.getHttpServer())
        .patch('/users/me/professional-profile/deactivate')
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(false);
          expect(deactivateUseCase.run).toHaveBeenCalledWith(userId);
        });
    });
  });
});
