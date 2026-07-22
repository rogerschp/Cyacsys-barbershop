import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PublicTenantServicesController } from 'src/modules/service/controllers/public-tenant-services.controller';
import { ListPublicTenantServicesUseCase } from 'src/modules/service/use-cases/list-public-tenant-services.use-case';

describe('PublicTenantServicesController (HTTP)', () => {
  let app: INestApplication;
  let useCase: { run: jest.Mock };

  beforeAll(async () => {
    useCase = { run: jest.fn().mockResolvedValue([]) };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicTenantServicesController],
      providers: [
        { provide: ListPublicTenantServicesUseCase, useValue: useCase },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tenants/:tenantId/public/services', () => {
    return request(app.getHttpServer())
      .get('/tenants/t1/public/services')
      .expect(200)
      .expect(() => {
        expect(useCase.run).toHaveBeenCalledWith('t1');
      });
  });
});
