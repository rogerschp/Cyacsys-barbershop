import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { UserBookingsController } from 'src/modules/booking/user-bookings.controller';
import { ListMyBookingsUseCase } from 'src/modules/booking/use-cases/list-my-bookings.use-case';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';

describe('UserBookingsController (HTTP)', () => {
  let app: INestApplication;
  let attachUser = true;
  const listMyBookingsUseCase = { run: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserBookingsController],
      providers: [
        {
          provide: ListMyBookingsUseCase,
          useValue: listMyBookingsUseCase,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          if (attachUser) {
            const req = context.switchToHttp().getRequest() as {
              user?: { dbUser: { id: string } };
            };
            req.user = { dbUser: { id: 'uuid-123' } };
          }
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users/me/bookings retorna 200 com agendamentos do usuario', () => {
    const bookings = [
      {
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
        tenant: {
          id: 'tenant-1',
          name: 'Barbearia do Vitinho',
          slug: 'barbearia-do-vitinho',
          telephone: '5511992834085',
          timezone: 'America/Sao_Paulo',
          address: null,
        },
        professional: {
          tenantProfessionalId: 'tp-1',
          displayName: 'João Pro',
        },
        service: {
          id: 'svc-1',
          name: 'Corte',
          durationInMinutes: 30,
        },
        date: '2026-04-06',
        startTime: '14:00',
        endTime: '14:30',
        startsAt: '2026-04-06T17:00:00.000Z',
        endsAt: '2026-04-06T17:30:00.000Z',
      },
    ];
    listMyBookingsUseCase.run.mockResolvedValue(bookings);

    return request(app.getHttpServer())
      .get('/users/me/bookings')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].tenant.name).toBe('Barbearia do Vitinho');
        expect(listMyBookingsUseCase.run).toHaveBeenCalledWith(
          'uuid-123',
          undefined,
        );
      });
  });

  it('GET /users/me/bookings retorna 404 quando usuario nao esta no request', async () => {
    attachUser = false;
    await request(app.getHttpServer()).get('/users/me/bookings').expect(404);
    attachUser = true;
  });
});
