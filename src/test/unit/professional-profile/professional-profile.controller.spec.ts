import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ProfessionalProfileController } from 'src/modules/professional-profile/professional-profile.controller';
import { CreateProfessionalProfileUseCase } from 'src/modules/professional-profile/use-cases/create-professional-profile.use-case';
import { UpdateProfessionalProfileUseCase } from 'src/modules/professional-profile/use-cases/update-professional-profile.use-case';
import { DeactivateProfessionalProfileUseCase } from 'src/modules/professional-profile/use-cases/deactivate-professional-profile.use-case';
import { GetProfessionalProfileByUserUseCase } from 'src/modules/professional-profile/use-cases/get-professional-profile-by-user.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';
import { ProfessionalProfileEntity } from 'src/modules/professional-profile/entities/professional-profile.entity';

describe('ProfessionalProfileController (HTTP)', () => {
  let app: INestApplication;
  let createUseCase: jest.Mocked<CreateProfessionalProfileUseCase>;
  let getUseCase: jest.Mocked<GetProfessionalProfileByUserUseCase>;
  let updateUseCase: jest.Mocked<UpdateProfessionalProfileUseCase>;
  let deactivateUseCase: jest.Mocked<DeactivateProfessionalProfileUseCase>;

  const mockProfile: ProfessionalProfileEntity = {
    id: 'profile-uuid',
    userId: 'user-uuid-123',
    displayName: 'João Silva',
    bio: null,
    avatarUrl: 'https://example.com/avatar.jpg',
    professionalType: ProfessionalType.BARBER,
    bookingMode: BookingMode.DIRECT_BOOKING,
    whatsappNumber: null,
    instagramUsername: null,
    experienceYears: 5,
    isActive: true,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
  } as ProfessionalProfileEntity;

  beforeAll(async () => {
    const mockCreate = { run: jest.fn() };
    const mockUpdate = { run: jest.fn() };
    const mockDeactivate = { run: jest.fn() };
    const mockGet = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfessionalProfileController],
      providers: [
        { provide: CreateProfessionalProfileUseCase, useValue: mockCreate },
        { provide: UpdateProfessionalProfileUseCase, useValue: mockUpdate },
        {
          provide: DeactivateProfessionalProfileUseCase,
          useValue: mockDeactivate,
        },
        { provide: GetProfessionalProfileByUserUseCase, useValue: mockGet },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => object } }) => {
          const req = context.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string } };
          };
          req.user = { dbUser: { id: 'user-uuid-123' } };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    createUseCase = moduleFixture.get(
      CreateProfessionalProfileUseCase,
    ) as jest.Mocked<CreateProfessionalProfileUseCase>;
    getUseCase = moduleFixture.get(GetProfessionalProfileByUserUseCase);
    updateUseCase = moduleFixture.get(UpdateProfessionalProfileUseCase);
    deactivateUseCase = moduleFixture.get(DeactivateProfessionalProfileUseCase);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users/me/professional-profile', async () => {
    createUseCase.run.mockResolvedValue(mockProfile);
    const res = await request(app.getHttpServer())
      .post('/users/me/professional-profile')
      .send({
        displayName: 'João Silva',
        avatarUrl: 'https://example.com/avatar.jpg',
        professionalType: ProfessionalType.BARBER,
        experienceYears: 5,
      })
      .expect(201);
    expect(res.body.id).toBe(mockProfile.id);
    expect(createUseCase.run).toHaveBeenCalledWith(
      'user-uuid-123',
      expect.objectContaining({ displayName: 'João Silva' }),
    );
  });

  it('GET /users/me/professional-profile', async () => {
    getUseCase.run.mockResolvedValue(mockProfile);
    const res = await request(app.getHttpServer())
      .get('/users/me/professional-profile')
      .expect(200);
    expect(res.body.userId).toBe('user-uuid-123');
  });

  it('PATCH /users/me/professional-profile', async () => {
    updateUseCase.run.mockResolvedValue({
      ...mockProfile,
      displayName: 'Atualizado',
    });
    const res = await request(app.getHttpServer())
      .patch('/users/me/professional-profile')
      .send({ displayName: 'Atualizado', bookingMode: BookingMode.WHATSAPP_ONLY })
      .expect(200);
    expect(res.body.displayName).toBe('Atualizado');
    expect(updateUseCase.run).toHaveBeenCalledWith('user-uuid-123', {
      displayName: 'Atualizado',
      bookingMode: BookingMode.WHATSAPP_ONLY,
    });
  });

  it('PATCH /users/me/professional-profile/deactivate', async () => {
    deactivateUseCase.run.mockResolvedValue({
      ...mockProfile,
      isActive: false,
    });
    const res = await request(app.getHttpServer())
      .patch('/users/me/professional-profile/deactivate')
      .expect(200);
    expect(res.body.isActive).toBe(false);
    expect(deactivateUseCase.run).toHaveBeenCalledWith('user-uuid-123');
  });
});
