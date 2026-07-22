import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TenantBookingsController } from 'src/modules/booking/controllers/tenant-bookings.controller';
import { ListTenantBookingsUseCase } from 'src/modules/booking/use-cases/list-tenant-bookings.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { BookingStatus } from 'src/modules/booking/entities/booking-status.enum';

describe('TenantBookingsController (HTTP)', () => {
  let app: INestApplication;
  let listTenantBookingsUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';

  beforeAll(async () => {
    listTenantBookingsUseCase = { run: jest.fn().mockResolvedValue([]) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantBookingsController],
      providers: [
        { provide: ListTenantBookingsUseCase, useValue: listTenantBookingsUseCase },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.tenant = { timezone: 'America/Fortaleza' };
          return true;
        },
      })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tenants/:tenantId/bookings chama use case com timezone do tenant', () => {
    return request(app.getHttpServer())
      .get(`/tenants/${tenantId}/bookings`)
      .query({ date: '2099-06-15', status: BookingStatus.DRAFT })
      .expect(200)
      .expect(() => {
        expect(listTenantBookingsUseCase.run).toHaveBeenCalledWith({
          tenantId,
          timezone: 'America/Fortaleza',
          date: '2099-06-15',
          status: BookingStatus.DRAFT,
        });
      });
  });
});
