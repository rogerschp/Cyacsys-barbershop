import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as request from 'supertest';
import { TenantController } from 'src/modules/tenant/tenant.controller';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';

describe('TenantController (HTTP)', () => {
  let app: INestApplication;
  let tenantService: jest.Mocked<TenantService>;

  const mockTenant: TenantEntity = {
    id: 'uuid-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  beforeAll(async () => {
    const mockService = {
      findBySlug: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      validateSlug: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tenantService = moduleFixture.get(
      TenantService,
    ) as jest.Mocked<TenantService>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tenants/validate-slug', () => {
    it('deve retornar 200 e { available: false } quando o slug já existe', () => {
      tenantService.validateSlug.mockResolvedValue({ available: false });

      return request(app.getHttpServer())
        .get('/tenants/validate-slug')
        .query({ slug: 'barbearia-do-vitinho' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: false });
          expect(tenantService.validateSlug).toHaveBeenCalled();
        });
    });

    it('deve retornar 200 e { available: true } quando o slug está disponível', () => {
      tenantService.validateSlug.mockResolvedValue({ available: true });

      return request(app.getHttpServer())
        .get('/tenants/validate-slug')
        .query({ slug: 'slug-novo' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: true });
        });
    });
  });

  describe('GET /tenants/:slug', () => {
    it('deve retornar 200 e o tenant quando o slug existe', () => {
      tenantService.findBySlug.mockResolvedValue(mockTenant);

      return request(app.getHttpServer())
        .get('/tenants/barbearia-do-vitinho')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(tenantService.findBySlug).toHaveBeenCalledWith(
            'barbearia-do-vitinho',
          );
        });
    });

    it('deve retornar 200 com body vazio quando o slug não existe', () => {
      tenantService.findBySlug.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/tenants/slug-inexistente')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({});
        });
    });
  });

  describe('POST /tenants', () => {
    it('deve retornar 201 e o tenant criado', () => {
      tenantService.create.mockResolvedValue(mockTenant);

      return request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'Barbearia do Vitinho', slug: 'barbearia-do-vitinho' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
          expect(res.body).toHaveProperty('id');
          expect(tenantService.create).toHaveBeenCalledWith({
            name: 'Barbearia do Vitinho',
            slug: 'barbearia-do-vitinho',
          });
        });
    });

    it('deve retornar 400 quando o slug já está em uso', () => {
      tenantService.create.mockRejectedValue(
        new BadRequestException('Slug already in use'),
      );

      return request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'Outra', slug: 'barbearia-do-vitinho' })
        .expect(400);
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('deve retornar 200 e o tenant atualizado', () => {
      const updated = { ...mockTenant, name: 'Nome Atualizado' };
      tenantService.update.mockResolvedValue(updated);

      return request(app.getHttpServer())
        .patch('/tenants/uuid-123')
        .send({ name: 'Nome Atualizado' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Nome Atualizado');
          expect(tenantService.update).toHaveBeenCalledWith('uuid-123', {
            name: 'Nome Atualizado',
          });
        });
    });

    it('deve retornar 404 quando o id não existe', () => {
      tenantService.update.mockRejectedValue(
        new NotFoundException('Tenant not found'),
      );

      return request(app.getHttpServer())
        .patch('/tenants/id-inexistente')
        .send({ name: 'Nome' })
        .expect(404);
    });
  });

  describe('DELETE /tenants/:id', () => {
    it('deve retornar 200 ao remover o tenant', async () => {
      tenantService.remove.mockResolvedValue({ affected: 1 } as any);

      await request(app.getHttpServer())
        .delete('/tenants/uuid-123')
        .expect(200);

      expect(tenantService.remove).toHaveBeenCalledWith('uuid-123');
    });

    it('deve retornar 404 quando o id não existe', () => {
      tenantService.remove.mockRejectedValue(
        new NotFoundException('Tenant not found'),
      );

      return request(app.getHttpServer())
        .delete('/tenants/id-inexistente')
        .expect(404);
    });
  });
});
