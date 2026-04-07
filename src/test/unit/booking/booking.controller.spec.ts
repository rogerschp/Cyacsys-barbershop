import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BookingController } from 'src/modules/booking/booking.controller';
import { CreateBookingDraftUseCase } from 'src/modules/booking/use-cases/create-booking-draft.use-case';
import { ConfirmBookingUseCase } from 'src/modules/booking/use-cases/confirm-booking.use-case';
import { CancelBookingDraftUseCase } from 'src/modules/booking/use-cases/cancel-booking-draft.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('BookingController (HTTP)', () => {
  let app: INestApplication;
  let createBookingDraftUseCase: jest.Mocked<CreateBookingDraftUseCase>;
  let confirmBookingUseCase: jest.Mocked<ConfirmBookingUseCase>;
  let cancelBookingDraftUseCase: jest.Mocked<CancelBookingDraftUseCase>;

  const tenantId = 'tenant-uuid';
  const barberProfileId = 'bp-uuid';
  const bookingId = 'booking-uuid';
  const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const basePath = `/tenants/${tenantId}/barber-profiles/${barberProfileId}/bookings`;

  const mockDraftResponse = {
    id: bookingId,
    tenantId,
    barberProfileId,
    serviceId,
    startsAt: new Date('2099-06-15T13:00:00.000Z').toISOString(),
    endsAt: new Date('2099-06-15T13:30:00.000Z').toISOString(),
    status: BookingStatus.DRAFT,
    createdByTenantUserId: 'tu-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const mockCreate = { run: jest.fn() };
    const mockConfirm = { run: jest.fn() };
    const mockCancel = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: CreateBookingDraftUseCase, useValue: mockCreate },
        { provide: ConfirmBookingUseCase, useValue: mockConfirm },
        { provide: CancelBookingDraftUseCase, useValue: mockCancel },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-uuid-123' }, uid: 'firebase-uid' };
          req.tenantMembership = { role: TenantUserRole.ADMIN };
          return true;
        },
      })
      .overrideInterceptor(TenantInterceptor)
      .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    createBookingDraftUseCase = moduleFixture.get(CreateBookingDraftUseCase);
    confirmBookingUseCase = moduleFixture.get(ConfirmBookingUseCase);
    cancelBookingDraftUseCase = moduleFixture.get(CancelBookingDraftUseCase);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createBookingDraftUseCase.run.mockResolvedValue(mockDraftResponse as any);
    confirmBookingUseCase.run.mockResolvedValue({
      ...mockDraftResponse,
      status: BookingStatus.CONFIRMED,
    } as any);
    cancelBookingDraftUseCase.run.mockResolvedValue({
      ...mockDraftResponse,
      status: BookingStatus.CANCELLED,
    } as any);
  });

  describe(`POST ${basePath}/draft`, () => {
    it('retorna 201 e chama use case com body válido', () => {
      return request(app.getHttpServer())
        .post(`${basePath}/draft`)
        .send({
          serviceId,
          date: '2099-06-15',
          startTime: '10:00',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe(BookingStatus.DRAFT);
          expect(createBookingDraftUseCase.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            {
              serviceId,
              date: '2099-06-15',
              startTime: '10:00',
            },
            'user-uuid-123',
            TenantUserRole.ADMIN,
          );
        });
    });

    it('retorna 400 quando serviceId não é UUID', () => {
      return request(app.getHttpServer())
        .post(`${basePath}/draft`)
        .send({
          serviceId: 'invalid',
          date: '2099-06-15',
          startTime: '10:00',
        })
        .expect(400);
    });

    it('retorna 400 quando startTime inválido', () => {
      return request(app.getHttpServer())
        .post(`${basePath}/draft`)
        .send({
          serviceId,
          date: '2099-06-15',
          startTime: '25:00',
        })
        .expect(400);
    });
  });

  describe(`PATCH ${basePath}/:id/confirm`, () => {
    it('retorna 200 e chama confirm', () => {
      return request(app.getHttpServer())
        .patch(`${basePath}/${bookingId}/confirm`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(BookingStatus.CONFIRMED);
          expect(confirmBookingUseCase.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            bookingId,
            'user-uuid-123',
            TenantUserRole.ADMIN,
          );
        });
    });
  });

  describe(`PATCH ${basePath}/:id/cancel`, () => {
    it('retorna 200 e chama cancel', () => {
      return request(app.getHttpServer())
        .patch(`${basePath}/${bookingId}/cancel`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(BookingStatus.CANCELLED);
          expect(cancelBookingDraftUseCase.run).toHaveBeenCalledWith(
            tenantId,
            barberProfileId,
            bookingId,
            'user-uuid-123',
            TenantUserRole.ADMIN,
          );
        });
    });
  });
});
