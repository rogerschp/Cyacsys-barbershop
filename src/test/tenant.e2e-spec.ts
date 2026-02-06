import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantEntity } from '../modules/tenant/entities/tenant.entity';

describe('TenantController (e2e)', () => {
  let app: INestApplication;

  const mockTenant: TenantEntity = {
    id: 'uuid-e2e-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeAll(async () => {
    mockRepository.findOne.mockImplementation(
      (args: { where: Record<string, string> }) => {
        const where = args?.where || {};
        if (
          where.slug === 'barbearia-do-vitinho' ||
          where.slug === 'uuid-e2e-123' ||
          where.id === 'uuid-e2e-123'
        ) {
          return Promise.resolve(mockTenant);
        }
        return Promise.resolve(null);
      },
    );
    mockRepository.create.mockImplementation((dto: any) => ({
      ...mockTenant,
      ...dto,
    }));
    mockRepository.save.mockResolvedValue(mockTenant);
    mockRepository.softDelete.mockResolvedValue({ affected: 1 });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(TenantEntity))
      .useValue(mockRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
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
      const res = await request(app.getHttpServer()).get(
        '/tenants/slug-inexistente',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });
  });

  describe('GET /tenants/validate-slug', () => {
    it('deve retornar { available: false } quando o slug já existe', () => {
      return request(app.getHttpServer())
        .get('/tenants/validate-slug?slug=barbearia-do-vitinho')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: false });
        });
    });

    it('deve retornar { available: true } quando o slug está disponível', () => {
      return request(app.getHttpServer())
        .get('/tenants/validate-slug?slug=slug-novo')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: true });
        });
    });
  });

  describe('GET /tenants/:id', () => {
    it('deve retornar 200 e o tenant quando o id existe', () => {
      return request(app.getHttpServer())
        .get('/tenants/uuid-e2e-123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-e2e-123');
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
        });
    });

    it('deve retornar 404 quando o id não existe', () => {
      return request(app.getHttpServer())
        .get('/tenants/id-inexistente')
        .expect(404);
    });
  });

  describe('POST /tenants', () => {
    it('deve retornar 201 e o tenant criado quando o slug está disponível', () => {
      return request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'Nova Barbearia', slug: 'nova-barbearia' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'nova-barbearia');
          expect(res.body).toHaveProperty('name', 'Nova Barbearia');
          expect(res.body).toHaveProperty('id');
        });
    });

    it('deve retornar 400 quando o slug já está em uso', () => {
      return request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'Outra', slug: 'barbearia-do-vitinho' })
        .expect(400);
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('deve retornar 200 e o tenant atualizado', () => {
      mockRepository.save.mockResolvedValueOnce({
        ...mockTenant,
        name: 'Nome Atualizado',
      });

      return request(app.getHttpServer())
        .patch('/tenants/uuid-e2e-123')
        .send({ name: 'Nome Atualizado' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Nome Atualizado');
        });
    });

    it('deve retornar 404 quando o id não existe', () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .patch('/tenants/id-inexistente')
        .send({ name: 'Nome' })
        .expect(404);
    });
  });

  describe('DELETE /tenants/:id', () => {
    it('deve retornar 200 ao remover o tenant', () => {
      return request(app.getHttpServer())
        .delete('/tenants/uuid-e2e-123')
        .expect(200);
    });

    it('deve retornar 404 quando o id não existe', () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .delete('/tenants/id-inexistente')
        .expect(404);
    });
  });
});
