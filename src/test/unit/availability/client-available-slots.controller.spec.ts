import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ClientAvailableSlotsController } from 'src/modules/availability/controllers/client-available-slots.controller';
import { GetClientAvailableSlotsUseCase } from 'src/modules/availability/use-cases/get-client-available-slots.use-case';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';

describe('ClientAvailableSlotsController (HTTP)', () => {
  let app: INestApplication;
  let useCase: { run: jest.Mock };

  beforeAll(async () => {
    useCase = { run: jest.fn().mockResolvedValue({ slots: [] }) };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ClientAvailableSlotsController],
      providers: [
        { provide: GetClientAvailableSlotsUseCase, useValue: useCase },
      ],
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

  it('GET slots públicos', () => {
    const serviceId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    return request(app.getHttpServer())
      .get(
        '/tenants/t1/tenant-professionals/tp1/available-slots/public',
      )
      .query({ serviceId, date: '2099-06-15' })
      .expect(200)
      .expect(() => {
        expect(useCase.run).toHaveBeenCalledWith(
          't1',
          'tp1',
          serviceId,
          '2099-06-15',
        );
      });
  });
});
