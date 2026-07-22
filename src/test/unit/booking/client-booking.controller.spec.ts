import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ClientBookingController } from 'src/modules/booking/controllers/client-booking.controller';
import { CreateClientBookingDraftUseCase } from 'src/modules/booking/use-cases/create-client-booking-draft.use-case';
import { ConfirmClientBookingUseCase } from 'src/modules/booking/use-cases/confirm-client-booking.use-case';
import { CancelClientBookingUseCase } from 'src/modules/booking/use-cases/cancel-client-booking.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('ClientBookingController (HTTP)', () => {
  let app: INestApplication;
  let createClientBookingDraftUseCase: { run: jest.Mock };
  let confirmClientBookingUseCase: { run: jest.Mock };
  let cancelClientBookingUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const bookingId = 'booking-uuid';
  const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const basePath = `/tenants/${tenantId}/tenant-professionals/${tenantProfessionalId}/bookings/public`;

  const entity = (status: BookingStatus) => ({
    id: bookingId,
    tenantId,
    tenantProfessionalId,
    serviceId,
    startsAt: new Date('2099-06-15T13:00:00.000Z'),
    endsAt: new Date('2099-06-15T13:30:00.000Z'),
    status,
    clientUserId: 'user-1',
    guestName: null,
    guestPhone: null,
    guestEmail: null,
    createdByTenantUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeAll(async () => {
    createClientBookingDraftUseCase = {
      run: jest.fn().mockResolvedValue(entity(BookingStatus.DRAFT)),
    };
    confirmClientBookingUseCase = {
      run: jest.fn().mockResolvedValue(entity(BookingStatus.CONFIRMED)),
    };
    cancelClientBookingUseCase = {
      run: jest.fn().mockResolvedValue(entity(BookingStatus.CANCELLED)),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ClientBookingController],
      providers: [
        {
          provide: CreateClientBookingDraftUseCase,
          useValue: createClientBookingDraftUseCase,
        },
        {
          provide: ConfirmClientBookingUseCase,
          useValue: confirmClientBookingUseCase,
        },
        {
          provide: CancelClientBookingUseCase,
          useValue: cancelClientBookingUseCase,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-1' } };
          return true;
        },
      })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST draft', () => {
    return request(app.getHttpServer())
      .post(`${basePath}/draft`)
      .send({ serviceId, date: '2099-06-15', startTime: '10:00' })
      .expect(201)
      .expect(() => {
        expect(createClientBookingDraftUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          expect.objectContaining({ serviceId }),
          'user-1',
        );
      });
  });

  it('PATCH confirm', () => {
    return request(app.getHttpServer())
      .patch(`${basePath}/${bookingId}/confirm`)
      .expect(200)
      .expect(() => {
        expect(confirmClientBookingUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          bookingId,
          'user-1',
        );
      });
  });

  it('PATCH cancel', () => {
    return request(app.getHttpServer())
      .patch(`${basePath}/${bookingId}/cancel`)
      .expect(200)
      .expect(() => {
        expect(cancelClientBookingUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          bookingId,
          'user-1',
        );
      });
  });
});
