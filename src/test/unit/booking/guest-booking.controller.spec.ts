import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { GuestBookingController } from 'src/modules/booking/controllers/guest-booking.controller';
import { CreateGuestBookingDraftUseCase } from 'src/modules/booking/use-cases/create-guest-booking-draft.use-case';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('GuestBookingController (HTTP)', () => {
  let app: INestApplication;
  let createGuestBookingDraftUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const basePath = `/tenants/${tenantId}/tenant-professionals/${tenantProfessionalId}/bookings/guest`;

  beforeAll(async () => {
    createGuestBookingDraftUseCase = {
      run: jest.fn().mockResolvedValue({
        id: 'b1',
        tenantId,
        tenantProfessionalId,
        serviceId,
        startsAt: new Date('2099-06-15T13:00:00.000Z'),
        endsAt: new Date('2099-06-15T13:30:00.000Z'),
        status: BookingStatus.DRAFT,
        clientUserId: null,
        guestName: 'João',
        guestPhone: '5511999999999',
        guestEmail: null,
        createdByTenantUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GuestBookingController],
      providers: [
        {
          provide: CreateGuestBookingDraftUseCase,
          useValue: createGuestBookingDraftUseCase,
        },
      ],
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
    await app.close();
  });

  it('POST draft cria booking guest', () => {
    return request(app.getHttpServer())
      .post(`${basePath}/draft`)
      .send({
        serviceId,
        date: '2099-06-15',
        startTime: '10:00',
        guestName: 'João',
        guestPhone: '11999999999',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe(BookingStatus.DRAFT);
        expect(createGuestBookingDraftUseCase.run).toHaveBeenCalledWith(
          tenantId,
          tenantProfessionalId,
          expect.objectContaining({
            guestName: 'João',
            guestPhone: '5511999999999',
          }),
        );
      });
  });
});
