import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ClientBookingController } from '../modules/booking/controllers/client-booking.controller';
import { CreateClientBookingDraftUseCase } from '../modules/booking/use-cases/create-client-booking-draft.use-case';
import { ConfirmClientBookingUseCase } from '../modules/booking/use-cases/confirm-client-booking.use-case';
import { CancelClientBookingUseCase } from '../modules/booking/use-cases/cancel-client-booking.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from '../common/guards/tenant-resolver.guard';
import { BookingStatus } from '../modules/booking/entities/booking-status.enum';

describe('ClientBookingController (e2e)', () => {
  let app: INestApplication;
  const createDraft = { run: jest.fn() };
  const confirm = { run: jest.fn() };
  const cancel = { run: jest.fn() };

  const tenantId = 'tenant-uuid';
  const tpId = 'tp-uuid';
  const bookingId = 'booking-uuid';
  const base = `/tenants/${tenantId}/tenant-professionals/${tpId}/bookings/public`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ClientBookingController],
      providers: [
        { provide: CreateClientBookingDraftUseCase, useValue: createDraft },
        { provide: ConfirmClientBookingUseCase, useValue: confirm },
        { provide: CancelClientBookingUseCase, useValue: cancel },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'client-user-1' } };
          return true;
        },
      })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST draft sem membership (só Bearer)', async () => {
    const entity = {
      id: bookingId,
      tenantId,
      tenantProfessionalId: tpId,
      serviceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      startsAt: new Date('2099-07-01T12:00:00.000Z'),
      endsAt: new Date('2099-07-01T12:30:00.000Z'),
      status: BookingStatus.DRAFT,
      clientUserId: 'client-user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    createDraft.run.mockResolvedValue(entity);

    const res = await request(app.getHttpServer())
      .post(`${base}/draft`)
      .send({
        serviceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        date: '2099-07-01',
        startTime: '09:00',
      })
      .expect(201);

    expect(createDraft.run).toHaveBeenCalledWith(
      tenantId,
      tpId,
      expect.objectContaining({ startTime: '09:00' }),
      'client-user-1',
    );
    expect(res.body.clientUserId).toBe('client-user-1');
    expect(res.body.status).toBe(BookingStatus.DRAFT);
  });

  it('PATCH confirm', async () => {
    confirm.run.mockResolvedValue({
      id: bookingId,
      tenantId,
      tenantProfessionalId: tpId,
      serviceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      startsAt: new Date('2099-07-01T12:00:00.000Z'),
      endsAt: new Date('2099-07-01T12:30:00.000Z'),
      status: BookingStatus.CONFIRMED,
      clientUserId: 'client-user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app.getHttpServer())
      .patch(`${base}/${bookingId}/confirm`)
      .expect(200);

    expect(confirm.run).toHaveBeenCalledWith(
      tenantId,
      tpId,
      bookingId,
      'client-user-1',
    );
  });
});
