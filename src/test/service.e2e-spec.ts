import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ServiceController } from '../modules/service/service.controller';
import { CreateServiceUseCase } from '../modules/service/use-cases/create-service.use-case';
import { UpdateServiceUseCase } from '../modules/service/use-cases/update-service.use-case';
import { DeactivateServiceUseCase } from '../modules/service/use-cases/deactivate-service.use-case';
import { ListServicesByTenantUseCase } from '../modules/service/use-cases/list-services.use-case';
import { GetServiceUseCase } from '../modules/service/use-cases/get-service.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { ServiceEntity } from '../modules/service/entities/service.entity';

/**
 * E2E do ServiceController com use cases mockados (sem DB).
 * Testa rotas, binding de parâmetros e respostas HTTP.
 */
describe('ServiceController (e2e)', () => {
  let app: INestApplication;
  let createServiceUseCase: jest.Mocked<CreateServiceUseCase>;
  let updateServiceUseCase: jest.Mocked<UpdateServiceUseCase>;
  let deactivateServiceUseCase: jest.Mocked<DeactivateServiceUseCase>;
  let listServicesByTenantUseCase: jest.Mocked<ListServicesByTenantUseCase>;
  let getServiceUseCase: jest.Mocked<GetServiceUseCase>;

  const tenantId = 'tenant-e2e-uuid';
  const serviceId = 'service-e2e-uuid';
  const mockService: ServiceEntity = {
    id: serviceId,
    tenantId,
    name: 'Corte masculino',
    description: 'Corte moderno',
    price: '45.00',
    durationInMinutes: 30,
    isActive: true,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  } as ServiceEntity;

  beforeAll(async () => {
    const mockCreate = { run: jest.fn() };
    const mockUpdate = { run: jest.fn() };
    const mockDeactivate = { run: jest.fn() };
    const mockList = { run: jest.fn() };
    const mockGet = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        { provide: CreateServiceUseCase, useValue: mockCreate },
        { provide: UpdateServiceUseCase, useValue: mockUpdate },
        { provide: DeactivateServiceUseCase, useValue: mockDeactivate },
        { provide: ListServicesByTenantUseCase, useValue: mockList },
        { provide: GetServiceUseCase, useValue: mockGet },
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

    createServiceUseCase = moduleFixture.get(CreateServiceUseCase) as jest.Mocked<CreateServiceUseCase>;
    updateServiceUseCase = moduleFixture.get(UpdateServiceUseCase) as jest.Mocked<UpdateServiceUseCase>;
    deactivateServiceUseCase = moduleFixture.get(DeactivateServiceUseCase) as jest.Mocked<DeactivateServiceUseCase>;
    listServicesByTenantUseCase = moduleFixture.get(ListServicesByTenantUseCase) as jest.Mocked<ListServicesByTenantUseCase>;
    getServiceUseCase = moduleFixture.get(GetServiceUseCase) as jest.Mocked<GetServiceUseCase>;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createServiceUseCase.run.mockResolvedValue(mockService);
    updateServiceUseCase.run.mockResolvedValue(mockService);
    deactivateServiceUseCase.run.mockResolvedValue({
      ...mockService,
      isActive: false,
    });
    listServicesByTenantUseCase.run.mockResolvedValue([mockService]);
    getServiceUseCase.run.mockResolvedValue(mockService);
  });

  describe('POST /tenants/:tenantId/services', () => {
    it('deve retornar 201 e o serviço criado', () => {
      return request(app.getHttpServer())
        .post(`/tenants/${tenantId}/services`)
        .send({
          name: 'Corte masculino',
          description: 'Corte moderno',
          price: 45,
          durationInMinutes: 30,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', serviceId);
          expect(res.body).toHaveProperty('name', 'Corte masculino');
          expect(res.body).toHaveProperty('tenantId', tenantId);
          expect(res.body).toHaveProperty('price', '45.00');
          expect(res.body).toHaveProperty('durationInMinutes', 30);
          expect(createServiceUseCase.run).toHaveBeenCalledWith(
            tenantId,
            expect.objectContaining({
              name: 'Corte masculino',
              price: 45,
              durationInMinutes: 30,
            }),
            'user-e2e-123',
          );
        });
    });

    it('deve retornar 400 quando body inválido (campos obrigatórios faltando)', () => {
      return request(app.getHttpServer())
        .post(`/tenants/${tenantId}/services`)
        .send({ name: 'Corte' })
        .expect(400);
    });
  });

  describe('GET /tenants/:tenantId/services', () => {
    it('deve retornar 200 e lista de serviços', () => {
      return request(app.getHttpServer())
        .get(`/tenants/${tenantId}/services`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('id', serviceId);
          expect(res.body[0]).toHaveProperty('name', 'Corte masculino');
          expect(listServicesByTenantUseCase.run).toHaveBeenCalledWith(tenantId);
        });
    });
  });

  describe('GET /tenants/:tenantId/services/:id', () => {
    it('deve retornar 200 e o serviço quando existe', () => {
      return request(app.getHttpServer())
        .get(`/tenants/${tenantId}/services/${serviceId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', serviceId);
          expect(res.body).toHaveProperty('name', 'Corte masculino');
          expect(getServiceUseCase.run).toHaveBeenCalledWith(
            tenantId,
            serviceId,
          );
        });
    });
  });

  describe('PATCH /tenants/:tenantId/services/:id', () => {
    it('deve retornar 200 e o serviço atualizado', () => {
      return request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/services/${serviceId}`)
        .send({ name: 'Corte premium' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', serviceId);
          expect(updateServiceUseCase.run).toHaveBeenCalledWith(
            tenantId,
            serviceId,
            { name: 'Corte premium' },
            'user-e2e-123',
          );
        });
    });
  });

  describe('PATCH /tenants/:tenantId/services/:id/deactivate', () => {
    it('deve retornar 200 e o serviço desativado', () => {
      return request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/services/${serviceId}/deactivate`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isActive', false);
          expect(deactivateServiceUseCase.run).toHaveBeenCalledWith(
            tenantId,
            serviceId,
            'user-e2e-123',
          );
        });
    });
  });
});
