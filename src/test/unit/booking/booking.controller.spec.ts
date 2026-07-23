import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BookingController } from 'src/modules/booking/booking.controller';
import { CreateBookingDraftUseCase } from 'src/modules/booking/use-cases/create-booking-draft.use-case';
import { ConfirmBookingUseCase } from 'src/modules/booking/use-cases/confirm-booking.use-case';
import { CancelBookingDraftUseCase } from 'src/modules/booking/use-cases/cancel-booking-draft.use-case';
import { CompleteBookingUseCase } from 'src/modules/booking/use-cases/complete-booking.use-case';
import { ListTenantProfessionalBookingsUseCase } from 'src/modules/booking/use-cases/list-tenant-professional-bookings.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('BookingController (HTTP)', () => {
  let app: INestApplication;
  let createBookingDraftUseCase: jest.Mocked<CreateBookingDraftUseCase>;
  let confirmBookingUseCase: jest.Mocked<ConfirmBookingUseCase>;
  let cancelBookingDraftUseCase: jest.Mocked<CancelBookingDraftUseCase>;
  let completeBookingUseCase: jest.Mocked<CompleteBookingUseCase>;
  let listTenantProfessionalBookingsUseCase: jest.Mocked<ListTenantProfessionalBookingsUseCase>;

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const bookingId = 'booking-uuid';
  const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const basePath = `/tenants/${tenantId}/tenant-professionals/${tenantProfessionalId}/bookings`;

  const mockBookingEntity = (status: BookingStatus) => ({
    id: bookingId,
    tenantId,
    tenantProfessionalId,
    serviceId,
    startsAt: new Date('2099-06-15T13:00:00.000Z'),
    endsAt: new Date('2099-06-15T13:30:00.000Z'),
    status,
    clientUserId: 'user-uuid-123',
    createdByTenantUserId: 'tu-1',
    createdAt: new Date('2099-06-15T12:00:00.000Z'),
    updatedAt: new Date('2099-06-15T12:00:00.000Z'),
  });

  beforeAll(async () => {
    const mockCreate = { run: jest.fn() };
    const mockConfirm = { run: jest.fn() };
    const mockCancel = { run: jest.fn() };
    const mockComplete = { run: jest.fn() };
    const mockList = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: CreateBookingDraftUseCase, useValue: mockCreate },
        { provide: ConfirmBookingUseCase, useValue: mockConfirm },
        { provide: CancelBookingDraftUseCase, useValue: mockCancel },
        { provide: CompleteBookingUseCase, useValue: mockComplete },
        { provide: ListTenantProfessionalBookingsUseCase, useValue: mockList },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-uuid-123' }, uid: 'firebase-uid' };
          req.tenantMembership = { role: TenantUserRole.ADMIN };
          req.tenant = { timezone: 'America/Sao_Paulo' };
          return true;
        },
      })
      .overrideInterceptor(TenantInterceptor)
      .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantResolverGuard)
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
    completeBookingUseCase = moduleFixture.get(CompleteBookingUseCase);
    listTenantProfessionalBookingsUseCase = moduleFixture.get(
      ListTenantProfessionalBookingsUseCase,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createBookingDraftUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.DRAFT) as any,
    );
    confirmBookingUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.CONFIRMED) as any,
    );
    cancelBookingDraftUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.CANCELLED) as any,
    );
    completeBookingUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.COMPLETED) as any,
    );
    listTenantProfessionalBookingsUseCase.run.mockResolvedValue([]);
  });

  describe(`GET ${basePath}`, () => {
    it('lista agenda do profissional com date e status', () => {
      return request(app.getHttpServer())
        .get(basePath)
        .query({ date: '2099-06-15', status: BookingStatus.CONFIRMED })
        .expect(200)
        .expect(() => {
          expect(
            listTenantProfessionalBookingsUseCase.run,
          ).toHaveBeenCalledWith({
            tenantId,
            tenantProfessionalId,
            timezone: 'America/Sao_Paulo',
            userId: 'user-uuid-123',
            callerRole: TenantUserRole.ADMIN,
            date: '2099-06-15',
            status: BookingStatus.CONFIRMED,
          });
        });
    });
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
            tenantProfessionalId,
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
            tenantProfessionalId,
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
            tenantProfessionalId,
            bookingId,
            'user-uuid-123',
            TenantUserRole.ADMIN,
          );
        });
    });
  });

  describe(`PATCH ${basePath}/:id/complete`, () => {
    it('retorna 200 e chama complete', () => {
      return request(app.getHttpServer())
        .patch(`${basePath}/${bookingId}/complete`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(BookingStatus.COMPLETED);
          expect(completeBookingUseCase.run).toHaveBeenCalledWith(
            tenantId,
            tenantProfessionalId,
            bookingId,
            'user-uuid-123',
            TenantUserRole.ADMIN,
          );
        });
    });
  });
});

describe('BookingController (HTTP) — user/tenant opcionais', () => {
  let app: INestApplication;
  let createBookingDraftUseCase: jest.Mocked<CreateBookingDraftUseCase>;
  let confirmBookingUseCase: jest.Mocked<ConfirmBookingUseCase>;
  let cancelBookingDraftUseCase: jest.Mocked<CancelBookingDraftUseCase>;
  let completeBookingUseCase: jest.Mocked<CompleteBookingUseCase>;

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const bookingId = 'booking-uuid';
  const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const basePath = `/tenants/${tenantId}/tenant-professionals/${tenantProfessionalId}/bookings`;

  beforeAll(async () => {
    const mockCreate = { run: jest.fn() };
    const mockConfirm = { run: jest.fn() };
    const mockCancel = { run: jest.fn() };
    const mockComplete = { run: jest.fn() };
    const mockList = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: CreateBookingDraftUseCase, useValue: mockCreate },
        { provide: ConfirmBookingUseCase, useValue: mockConfirm },
        { provide: CancelBookingDraftUseCase, useValue: mockCancel },
        { provide: CompleteBookingUseCase, useValue: mockComplete },
        { provide: ListTenantProfessionalBookingsUseCase, useValue: mockList },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {};
          req.tenantMembership = undefined;
          return true;
        },
      })
      .overrideInterceptor(TenantInterceptor)
      .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantResolverGuard)
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
    completeBookingUseCase = moduleFixture.get(CompleteBookingUseCase);
  });

  afterAll(async () => {
    await app.close();
  });

  const mockBookingEntity = (status: BookingStatus) => ({
    id: bookingId,
    tenantId,
    tenantProfessionalId,
    serviceId,
    startsAt: new Date('2099-06-15T13:00:00.000Z'),
    endsAt: new Date('2099-06-15T13:30:00.000Z'),
    status,
    clientUserId: null,
    createdByTenantUserId: null,
    createdAt: new Date('2099-06-15T12:00:00.000Z'),
    updatedAt: new Date('2099-06-15T12:00:00.000Z'),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createBookingDraftUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.DRAFT) as any,
    );
    confirmBookingUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.CONFIRMED) as any,
    );
    cancelBookingDraftUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.CANCELLED) as any,
    );
    completeBookingUseCase.run.mockResolvedValue(
      mockBookingEntity(BookingStatus.COMPLETED) as any,
    );
  });

  it('POST draft usa userId vazio e role undefined nos optional chains', () => {
    return request(app.getHttpServer())
      .post(`${basePath}/draft`)
      .send({
        serviceId,
        date: '2099-06-15',
        startTime: '10:00',
      })
      .expect(201)
      .expect(() => {
        expect(createBookingDraftUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          expect.objectContaining({
            serviceId,
            date: '2099-06-15',
            startTime: '10:00',
          }),
          '',
          undefined,
        );
      });
  });

  it('PATCH confirm passa userId vazio e role undefined', () => {
    return request(app.getHttpServer())
      .patch(`${basePath}/${bookingId}/confirm`)
      .expect(200)
      .expect(() => {
        expect(confirmBookingUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          bookingId,
          '',
          undefined,
        );
      });
  });

  it('PATCH cancel passa userId vazio e role undefined', () => {
    return request(app.getHttpServer())
      .patch(`${basePath}/${bookingId}/cancel`)
      .expect(200)
      .expect(() => {
        expect(cancelBookingDraftUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          bookingId,
          '',
          undefined,
        );
      });
  });

  it('PATCH complete passa userId vazio e role undefined', () => {
    return request(app.getHttpServer())
      .patch(`${basePath}/${bookingId}/complete`)
      .expect(200)
      .expect(() => {
        expect(completeBookingUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          bookingId,
          '',
          undefined,
        );
      });
  });
});
