import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { TenantService } from '../modules/tenant/tenant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantEntity } from '../modules/tenant/entities/tenant.entity';

describe('TenantController (e2e)', () => {
  let app: INestApplication;
  let tenantService: TenantService;

  const mockTenant: TenantEntity = {
    id: 'uuid-e2e-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    createdAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(TenantEntity))
      .useValue({
        findOne: jest.fn().mockResolvedValue(mockTenant),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tenantService = moduleFixture.get<TenantService>(TenantService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /tenants/:slug', () => {
    it('deve retornar 200 e o tenant quando o slug existe', () => {
      return request(app.getHttpServer())
        .get('/tenants/barbearia-do-vitinho')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
          expect(res.body).toHaveProperty('id');
        });
    });

    it('deve retornar 200 com body vazio quando o slug não existe', async () => {
      jest.spyOn(tenantService, 'findBySlug').mockResolvedValueOnce(null);

      const res = await request(app.getHttpServer()).get(
        '/tenants/slug-inexistente',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });
  });
});
