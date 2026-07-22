import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PublicTenantProfessionalsController } from 'src/modules/tenant-professional/controllers/public-tenant-professionals.controller';
import { ListPublicTenantProfessionalsUseCase } from 'src/modules/tenant-professional/use-cases/list-public-tenant-professionals.use-case';

describe('PublicTenantProfessionalsController (HTTP)', () => {
  let app: INestApplication;
  let useCase: { run: jest.Mock };

  beforeAll(async () => {
    useCase = { run: jest.fn().mockResolvedValue([]) };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicTenantProfessionalsController],
      providers: [
        {
          provide: ListPublicTenantProfessionalsUseCase,
          useValue: useCase,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tenants/:tenantId/public/professionals', () => {
    return request(app.getHttpServer())
      .get('/tenants/t1/public/professionals')
      .expect(200)
      .expect(() => {
        expect(useCase.run).toHaveBeenCalledWith('t1');
      });
  });
});
