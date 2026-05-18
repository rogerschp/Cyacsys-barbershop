import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { TenantController } from 'src/modules/tenant/tenant.controller';
import { CreateTenantWithOwnerUseCase } from 'src/modules/tenant/use-cases/create-tenant-with-owner.use-case';
import { CreateTenantUseCase } from 'src/modules/tenant/use-cases/create-tenant.use-case';
import { DeleteTenantByIdUseCase } from 'src/modules/tenant/use-cases/delete-tenant-by-id.use-case';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { FindTenantBySlugUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-slug.use-case';
import { UpdateTenantByIdUseCase } from 'src/modules/tenant/use-cases/update-tenant-by-id.use-case';
import { ValidateSlugUseCase } from 'src/modules/tenant/use-cases/validate-slug.use-case';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';
import { ConflictException } from '@nestjs/common';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';

describe('TenantController (HTTP)', () => {
  let app: INestApplication;
  let validateSlugUseCase: { run: jest.Mock };
  let findTenantByIdUseCase: { run: jest.Mock };
  let findTenantBySlugUseCase: { run: jest.Mock };
  let createTenantUseCase: { run: jest.Mock };
  let updateTenantByIdUseCase: { run: jest.Mock };
  let deleteTenantByIdUseCase: { run: jest.Mock };
  let createTenantWithOwnerUseCase: jest.Mocked<CreateTenantWithOwnerUseCase>;

  const mockTenant: TenantEntity = {
    id: 'uuid-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    status: TenantStatus.ACTIVE,
    timezone: 'America/Sao_Paulo',
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  } as TenantEntity;

  beforeAll(async () => {
    validateSlugUseCase = { run: jest.fn() };
    findTenantByIdUseCase = { run: jest.fn() };
    findTenantBySlugUseCase = { run: jest.fn() };
    createTenantUseCase = { run: jest.fn() };
    updateTenantByIdUseCase = { run: jest.fn() };
    deleteTenantByIdUseCase = { run: jest.fn() };
    const mockCreateWithOwner = {
      run: jest.fn(),
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        { provide: ValidateSlugUseCase, useValue: validateSlugUseCase },
        { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
        { provide: FindTenantBySlugUseCase, useValue: findTenantBySlugUseCase },
        { provide: CreateTenantUseCase, useValue: createTenantUseCase },
        { provide: UpdateTenantByIdUseCase, useValue: updateTenantByIdUseCase },
        { provide: DeleteTenantByIdUseCase, useValue: deleteTenantByIdUseCase },
        {
          provide: CreateTenantWithOwnerUseCase,
          useValue: mockCreateWithOwner,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-uuid-123' }, uid: 'firebase-uid' };
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
    await app.init();
    createTenantWithOwnerUseCase = moduleFixture.get(
      CreateTenantWithOwnerUseCase,
    ) as jest.Mocked<CreateTenantWithOwnerUseCase>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tenants/validate-slug', () => {
    it('deve retornar 200 e { available: false } quando o slug já existe', () => {
      validateSlugUseCase.run.mockResolvedValue({ available: false });
      return request(app.getHttpServer())
        .get('/tenants/validate-slug')
        .query({ slug: 'barbearia-do-vitinho' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: false });
          expect(validateSlugUseCase.run).toHaveBeenCalledWith({
            slug: 'barbearia-do-vitinho',
          });
        });
    });
    it('deve retornar 200 e { available: true } quando o slug está disponível', () => {
      validateSlugUseCase.run.mockResolvedValue({ available: true });
      return request(app.getHttpServer())
        .get('/tenants/validate-slug')
        .query({ slug: 'slug-novo' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ available: true });
        });
    });
  });

  describe('GET /tenants/by-id/:id', () => {
    it('deve retornar 200 e o tenant quando o id existe', () => {
      findTenantByIdUseCase.run.mockResolvedValue(mockTenant);
      return request(app.getHttpServer())
        .get('/tenants/by-id/uuid-123')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(findTenantByIdUseCase.run).toHaveBeenCalledWith('uuid-123');
        });
    });
  });

  describe('GET /tenants/by-slug/:slug', () => {
    it('deve retornar 200 e o tenant quando o slug existe', () => {
      findTenantBySlugUseCase.run.mockResolvedValue(mockTenant);
      return request(app.getHttpServer())
        .get('/tenants/by-slug/barbearia-do-vitinho')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(findTenantBySlugUseCase.run).toHaveBeenCalledWith(
            'barbearia-do-vitinho',
          );
        });
    });
    it('deve retornar 404 quando o slug não existe', () => {
      findTenantBySlugUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found!'),
      );
      return request(app.getHttpServer())
        .get('/tenants/by-slug/slug-inexistente')
        .expect(404);
    });
  });

  describe('POST /tenants', () => {
    it('deve retornar 201 e o tenant criado', () => {
      createTenantUseCase.run.mockResolvedValue(mockTenant);
      return request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'Barbearia do Vitinho', slug: 'barbearia-do-vitinho' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(res.body).toHaveProperty('name', 'Barbearia do Vitinho');
          expect(res.body).toHaveProperty('id');
          expect(createTenantUseCase.run).toHaveBeenCalledWith({
            name: 'Barbearia do Vitinho',
            slug: 'barbearia-do-vitinho',
          });
        });
    });
    it('deve retornar 409 quando o slug já está em uso', () => {
      createTenantUseCase.run.mockRejectedValue(
        new ConflictException('Slug already in use'),
      );
      return request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'Outra', slug: 'barbearia-do-vitinho' })
        .expect(409);
    });
  });

  describe('POST /tenants/with-owner', () => {
    it('deve retornar 201 e o tenant criado com usuario como OWNER', () => {
      createTenantWithOwnerUseCase.run.mockResolvedValue(mockTenant);
      return request(app.getHttpServer())
        .post('/tenants/with-owner')
        .set('Authorization', 'Bearer fake-token')
        .send({ name: 'Barbearia Nova', slug: 'barbearia-nova' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'uuid-123');
          expect(res.body).toHaveProperty('slug', 'barbearia-do-vitinho');
          expect(createTenantWithOwnerUseCase.run).toHaveBeenCalledWith(
            'user-uuid-123',
            { name: 'Barbearia Nova', slug: 'barbearia-nova' },
          );
        });
    });
  });

  describe('PATCH /tenants/:id', () => {
    it('deve retornar 200 e o tenant atualizado', () => {
      const updated = { ...mockTenant, name: 'Nome Atualizado' };
      updateTenantByIdUseCase.run.mockResolvedValue(updated);
      return request(app.getHttpServer())
        .patch('/tenants/uuid-123')
        .send({ name: 'Nome Atualizado' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Nome Atualizado');
          expect(updateTenantByIdUseCase.run).toHaveBeenCalledWith('uuid-123', {
            name: 'Nome Atualizado',
          });
        });
    });
    it('deve retornar 404 quando o id não existe', () => {
      updateTenantByIdUseCase.run.mockRejectedValue(
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
      deleteTenantByIdUseCase.run.mockResolvedValue({ affected: 1 } as any);
      await request(app.getHttpServer()).delete('/tenants/uuid-123').expect(200);
      expect(deleteTenantByIdUseCase.run).toHaveBeenCalledWith('uuid-123');
    });
    it('deve retornar 404 quando o id não existe', () => {
      deleteTenantByIdUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found'),
      );
      return request(app.getHttpServer())
        .delete('/tenants/id-inexistente')
        .expect(404);
    });
  });
});
