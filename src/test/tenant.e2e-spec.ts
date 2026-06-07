import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  NotFoundException,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { TenantController } from '../modules/tenant/tenant.controller';
import { ValidateSlugUseCase } from '../modules/tenant/use-cases/validate-slug.use-case';
import { FindTenantByIdUseCase } from '../modules/tenant/use-cases/find-tenant-by-id.use-case';
import { FindTenantBySlugUseCase } from '../modules/tenant/use-cases/find-tenant-by-slug.use-case';
import { CreateTenantUseCase } from '../modules/tenant/use-cases/create-tenant.use-case';
import { UpdateTenantByIdUseCase } from '../modules/tenant/use-cases/update-tenant-by-id.use-case';
import { DeleteTenantByIdUseCase } from '../modules/tenant/use-cases/delete-tenant-by-id.use-case';
import { CreateTenantWithOwnerUseCase } from '../modules/tenant/use-cases/create-tenant-with-owner.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { TenantEntity } from '../modules/tenant/entities/tenant.entity';
import { TenantStatus } from '../modules/tenant/entities/tenant-status.enum';

describe('TenantController (e2e)', () => {
  let app: INestApplication;
  let validateSlugUseCase: jest.Mocked<ValidateSlugUseCase>;
  let findByIdUseCase: jest.Mocked<FindTenantByIdUseCase>;
  let findBySlugUseCase: jest.Mocked<FindTenantBySlugUseCase>;
  let createTenantUseCase: jest.Mocked<CreateTenantUseCase>;
  let updateTenantUseCase: jest.Mocked<UpdateTenantByIdUseCase>;
  let deleteTenantUseCase: jest.Mocked<DeleteTenantByIdUseCase>;

  const mockTenant: TenantEntity = {
    id: 'uuid-e2e-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    status: TenantStatus.ACTIVE,
    telephone: '5511999999999',
    addressId: null,
    address: null,
    timezone: 'America/Sao_Paulo',
    socialMedia: null,
    cnpj: null,
    segment: null,
    avatarUrl: null,
    latitude: null,
    longitude: null,
    theme: null,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        { provide: ValidateSlugUseCase, useValue: { run: jest.fn() } },
        { provide: FindTenantByIdUseCase, useValue: { run: jest.fn() } },
        { provide: FindTenantBySlugUseCase, useValue: { run: jest.fn() } },
        { provide: CreateTenantUseCase, useValue: { run: jest.fn() } },
        { provide: UpdateTenantByIdUseCase, useValue: { run: jest.fn() } },
        { provide: DeleteTenantByIdUseCase, useValue: { run: jest.fn() } },
        { provide: CreateTenantWithOwnerUseCase, useValue: { run: jest.fn() } },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-e2e-123' }, uid: 'firebase-uid' };
          return true;
        },
      })
      .overrideInterceptor(TenantInterceptor)
      .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    validateSlugUseCase = moduleFixture.get(ValidateSlugUseCase);
    findByIdUseCase = moduleFixture.get(FindTenantByIdUseCase);
    findBySlugUseCase = moduleFixture.get(FindTenantBySlugUseCase);
    createTenantUseCase = moduleFixture.get(CreateTenantUseCase);
    updateTenantUseCase = moduleFixture.get(UpdateTenantByIdUseCase);
    deleteTenantUseCase = moduleFixture.get(DeleteTenantByIdUseCase);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /tenants/by-slug/:slug', () => {
    it('deve retornar 200 e o tenant quando o slug existe', () => {
      findBySlugUseCase.run.mockResolvedValue(mockTenant);
      return request(app.getHttpServer())
        .get('/tenants/by-slug/barbearia-do-vitinho')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
          expect(res.body).toHaveProperty('id');
        });
    });

    it('deve retornar 404 quando o slug não existe', () => {
      findBySlugUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found!'),
      );
      return request(app.getHttpServer())
        .get('/tenants/by-slug/slug-inexistente')
        .expect(404);
    });
  });

  describe('GET /tenants/validate-slug', () => {
    it('deve retornar { available: false } quando o slug já existe', () => {
      validateSlugUseCase.run.mockResolvedValue({ available: false });
      return request(app.getHttpServer())
        .get('/tenants/validate-slug?slug=barbearia-do-vitinho')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: false });
        });
    });

    it('deve retornar { available: true } quando o slug está disponível', () => {
      validateSlugUseCase.run.mockResolvedValue({ available: true });
      return request(app.getHttpServer())
        .get('/tenants/validate-slug?slug=slug-novo')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: true });
        });
    });
  });

  describe('GET /tenants/by-id/:id', () => {
    it('deve retornar 200 e o tenant quando o id existe', () => {
      findByIdUseCase.run.mockResolvedValue(mockTenant);
      return request(app.getHttpServer())
        .get('/tenants/by-id/uuid-e2e-123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-e2e-123');
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
        });
    });

    it('deve retornar 404 quando o id não existe', () => {
      findByIdUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found!'),
      );
      return request(app.getHttpServer())
        .get('/tenants/by-id/id-inexistente')
        .expect(404);
    });
  });

  describe('POST /tenants', () => {
    it('deve retornar 201 e o tenant criado quando o slug está disponível', () => {
      createTenantUseCase.run.mockResolvedValue({
        ...mockTenant,
        slug: 'nova-barbearia',
        name: 'Nova Barbearia',
      });
      return request(app.getHttpServer())
        .post('/tenants')
        .send({
          name: 'Nova Barbearia',
          slug: 'nova-barbearia',
          telephone: '5511999999999',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'nova-barbearia');
          expect(res.body).toHaveProperty('name', 'Nova Barbearia');
          expect(res.body).toHaveProperty('id');
        });
    });

    it('deve retornar 409 quando o slug já está em uso', () => {
      createTenantUseCase.run.mockRejectedValue(
        new ConflictException('Slug already in use'),
      );
      return request(app.getHttpServer())
        .post('/tenants')
        .send({
          name: 'Outra',
          slug: 'barbearia-do-vitinho',
          telephone: '5511999999999',
        })
        .expect(409);
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('deve retornar 200 e o tenant atualizado', () => {
      updateTenantUseCase.run.mockResolvedValue({
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
      updateTenantUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found!'),
      );
      return request(app.getHttpServer())
        .patch('/tenants/id-inexistente')
        .send({ name: 'Nome' })
        .expect(404);
    });
  });

  describe('DELETE /tenants/:id', () => {
    it('deve retornar 200 ao remover o tenant', () => {
      deleteTenantUseCase.run.mockResolvedValue(undefined);
      return request(app.getHttpServer())
        .delete('/tenants/uuid-e2e-123')
        .expect(200);
    });

    it('deve retornar 404 quando o id não existe', () => {
      deleteTenantUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant Not Found!'),
      );
      return request(app.getHttpServer())
        .delete('/tenants/id-inexistente')
        .expect(404);
    });
  });
});
