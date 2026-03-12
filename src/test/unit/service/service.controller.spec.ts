import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { ServiceController } from 'src/modules/service/service.controller';
import { CreateServiceUseCase } from 'src/modules/service/use-cases/create-service.use-case';
import { UpdateServiceUseCase } from 'src/modules/service/use-cases/update-service.use-case';
import { DeactivateServiceUseCase } from 'src/modules/service/use-cases/deactivate-service.use-case';
import { ListServicesByTenantUseCase } from 'src/modules/service/use-cases/list-services.use-case';
import { GetServiceUseCase } from 'src/modules/service/use-cases/get-service.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { ServiceEntity } from 'src/modules/service/entities/service.entity';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('ServiceController (HTTP)', () => {
  let app: INestApplication;
  let createServiceUseCase: jest.Mocked<CreateServiceUseCase>;
  let updateServiceUseCase: jest.Mocked<UpdateServiceUseCase>;
  let deactivateServiceUseCase: jest.Mocked<DeactivateServiceUseCase>;
  let listServicesByTenantUseCase: jest.Mocked<ListServicesByTenantUseCase>;
  let getServiceUseCase: jest.Mocked<GetServiceUseCase>;

  const tenantId = 'tenant-uuid';
  const serviceId = 'service-uuid';
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

    createServiceUseCase = moduleFixture.get(
      CreateServiceUseCase,
    ) as jest.Mocked<CreateServiceUseCase>;
    updateServiceUseCase = moduleFixture.get(
      UpdateServiceUseCase,
    ) as jest.Mocked<UpdateServiceUseCase>;
    deactivateServiceUseCase = moduleFixture.get(
      DeactivateServiceUseCase,
    ) as jest.Mocked<DeactivateServiceUseCase>;
    listServicesByTenantUseCase = moduleFixture.get(
      ListServicesByTenantUseCase,
    ) as jest.Mocked<ListServicesByTenantUseCase>;
    getServiceUseCase = moduleFixture.get(
      GetServiceUseCase,
    ) as jest.Mocked<GetServiceUseCase>;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tenants/:tenantId/services', () => {
    it('deve retornar 201 e o serviço criado', () => {
      createServiceUseCase.run.mockResolvedValue(mockService);

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
          expect(res.body).toHaveProperty('price', '45.00');
          expect(createServiceUseCase.run).toHaveBeenCalledWith(
            tenantId,
            expect.objectContaining({
              name: 'Corte masculino',
              price: 45,
              durationInMinutes: 30,
            }),
            'user-uuid-123',
          );
        });
    });

    it('deve retornar 400 quando regra de negócio violada', () => {
      createServiceUseCase.run.mockRejectedValue(
        new BusinessRuleException(
          'SERVICE_NAME_ALREADY_EXISTS',
          'Nome já existe',
        ),
      );

      return request(app.getHttpServer())
        .post(`/tenants/${tenantId}/services`)
        .send({
          name: 'Corte masculino',
          price: 45,
          durationInMinutes: 30,
        })
        .expect(400);
    });

    it('deve retornar 404 quando tenant não existe', () => {
      createServiceUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found'),
      );

      return request(app.getHttpServer())
        .post(`/tenants/${tenantId}/services`)
        .send({
          name: 'Corte',
          price: 45,
          durationInMinutes: 30,
        })
        .expect(404);
    });
  });

  describe('GET /tenants/:tenantId/services', () => {
    it('deve retornar 200 e lista de serviços', () => {
      listServicesByTenantUseCase.run.mockResolvedValue([mockService]);

      return request(app.getHttpServer())
        .get(`/tenants/${tenantId}/services`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('id', serviceId);
          expect(listServicesByTenantUseCase.run).toHaveBeenCalledWith(
            tenantId,
          );
        });
    });
  });

  describe('GET /tenants/:tenantId/services/:id', () => {
    it('deve retornar 200 e o serviço quando existe', () => {
      getServiceUseCase.run.mockResolvedValue(mockService);

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

    it('deve retornar 404 quando serviço não existe', () => {
      getServiceUseCase.run.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      return request(app.getHttpServer())
        .get(`/tenants/${tenantId}/services/${serviceId}`)
        .expect(404);
    });
  });

  describe('PATCH /tenants/:tenantId/services/:id', () => {
    it('deve retornar 200 e o serviço atualizado', () => {
      const updated = { ...mockService, name: 'Corte premium' };
      updateServiceUseCase.run.mockResolvedValue(updated);

      return request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/services/${serviceId}`)
        .send({ name: 'Corte premium' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Corte premium');
          expect(updateServiceUseCase.run).toHaveBeenCalledWith(
            tenantId,
            serviceId,
            { name: 'Corte premium' },
            'user-uuid-123',
          );
        });
    });

    it('deve retornar 404 quando serviço não existe', () => {
      updateServiceUseCase.run.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      return request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/services/${serviceId}`)
        .send({ name: 'Corte' })
        .expect(404);
    });
  });

  describe('PATCH /tenants/:tenantId/services/:id/deactivate', () => {
    it('deve retornar 200 e o serviço desativado', () => {
      const deactivated = { ...mockService, isActive: false };
      deactivateServiceUseCase.run.mockResolvedValue(deactivated);

      return request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/services/${serviceId}/deactivate`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isActive', false);
          expect(deactivateServiceUseCase.run).toHaveBeenCalledWith(
            tenantId,
            serviceId,
            'user-uuid-123',
          );
        });
    });

    it('deve retornar 404 quando serviço não existe', () => {
      deactivateServiceUseCase.run.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      return request(app.getHttpServer())
        .patch(`/tenants/${tenantId}/services/${serviceId}/deactivate`)
        .expect(404);
    });
  });
});
