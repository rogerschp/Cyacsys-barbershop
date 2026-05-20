import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BookingController } from '../modules/booking/booking.controller';
import { CreateBookingDraftUseCase } from '../modules/booking/use-cases/create-booking-draft.use-case';
import { ConfirmBookingUseCase } from '../modules/booking/use-cases/confirm-booking.use-case';
import { CancelBookingDraftUseCase } from '../modules/booking/use-cases/cancel-booking-draft.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { TenantUserRole } from '../modules/tenant-user/entities/tenant-user-role.enum';
import { BookingStatus } from '../modules/booking/entities/booking-status.enum';

describe('BookingController (e2e)', () => {
  let app: INestApplication;
  let createBookingDraftUseCase: jest.Mocked<CreateBookingDraftUseCase>;
  let confirmBookingUseCase: jest.Mocked<ConfirmBookingUseCase>;
  let cancelBookingDraftUseCase: jest.Mocked<CancelBookingDraftUseCase>;

  const tenantId = 'tenant-e2e-uuid';
  const tenantProfessionalId = 'tp-e2e-uuid';
  const bookingId = 'booking-e2e-uuid';
  const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const basePath = `/tenants/${tenantId}/tenant-professionals/${tenantProfessionalId}/bookings`;

  beforeAll(async () => {
    const mocks = {
      createDraft: { run: jest.fn() },
      confirm: { run: jest.fn() },
      cancelDraft: { run: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: CreateBookingDraftUseCase, useValue: mocks.createDraft },
        { provide: ConfirmBookingUseCase, useValue: mocks.confirm },
        { provide: CancelBookingDraftUseCase, useValue: mocks.cancelDraft },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-e2e-123' }, uid: 'firebase-uid' };
          req.tenantMembership = { role: TenantUserRole.STAFF };
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

    createBookingDraftUseCase = moduleFixture.get(
      CreateBookingDraftUseCase,
    ) as jest.Mocked<CreateBookingDraftUseCase>;
    confirmBookingUseCase = moduleFixture.get(
      ConfirmBookingUseCase,
    ) as jest.Mocked<ConfirmBookingUseCase>;
    cancelBookingDraftUseCase = moduleFixture.get(
      CancelBookingDraftUseCase,
    ) as jest.Mocked<CancelBookingDraftUseCase>;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createBookingDraftUseCase.run.mockResolvedValue({
      id: bookingId,
      status: BookingStatus.DRAFT,
    } as any);
    confirmBookingUseCase.run.mockResolvedValue({
      id: bookingId,
      status: BookingStatus.CONFIRMED,
    } as any);
    cancelBookingDraftUseCase.run.mockResolvedValue({
      id: bookingId,
      status: BookingStatus.CANCELLED,
    } as any);
  });

  describe(`POST ${basePath}/draft`, () => {
    it('deve retornar 201 e chamar use case quando body válido', () => {
      return request(app.getHttpServer())
        .post(`${basePath}/draft`)
        .send({
          serviceId,
          date: '2099-07-01',
          startTime: '09:00',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: bookingId,
            status: BookingStatus.DRAFT,
          });
          expect(createBookingDraftUseCase.run).toHaveBeenCalledWith(
            tenantId,
            tenantProfessionalId,
            {
              serviceId,
              date: '2099-07-01',
              startTime: '09:00',
            },
            'user-e2e-123',
            TenantUserRole.STAFF,
          );
        });
    });

    it('deve retornar 400 quando falta serviceId', () => {
      return request(app.getHttpServer())
        .post(`${basePath}/draft`)
        .send({
          date: '2099-07-01',
          startTime: '09:00',
        })
        .expect(400);
    });

    it('deve retornar 400 quando date não é yyyy-MM-dd', () => {
      return request(app.getHttpServer())
        .post(`${basePath}/draft`)
        .send({
          serviceId,
          date: '01-07-2099',
          startTime: '09:00',
        })
        .expect(400);
    });
  });

  describe(`PATCH ${basePath}/:bookingId/confirm`, () => {
    it('deve retornar 200 e chamar confirm', () => {
      return request(app.getHttpServer())
        .patch(`${basePath}/${bookingId}/confirm`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(BookingStatus.CONFIRMED);
          expect(confirmBookingUseCase.run).toHaveBeenCalledWith(
            tenantId,
            tenantProfessionalId,
            bookingId,
            'user-e2e-123',
            TenantUserRole.STAFF,
          );
        });
    });
  });

  describe(`PATCH ${basePath}/:bookingId/cancel`, () => {
    it('deve retornar 200 e chamar cancel', () => {
      return request(app.getHttpServer())
        .patch(`${basePath}/${bookingId}/cancel`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(BookingStatus.CANCELLED);
          expect(cancelBookingDraftUseCase.run).toHaveBeenCalledWith(
            tenantId,
            tenantProfessionalId,
            bookingId,
            'user-e2e-123',
            TenantUserRole.STAFF,
          );
        });
    });
  });
});
