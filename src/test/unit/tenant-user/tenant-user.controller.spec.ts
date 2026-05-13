import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { TenantUserController } from 'src/modules/tenant-user/tenant-user.controller';
import { AddUserToTenantUseCase } from 'src/modules/tenant-user/use-cases/add-user-to-tenant.use-case';
import { FindMembershipByTenantIdAndUserIdUseCase } from 'src/modules/tenant-user/use-cases/find-membership-by-tenantId-and-userId.use-case';
import { FindTenantUserByIdAndTenantUseCase } from 'src/modules/tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { FindUserRoleByUserIdAndTenantIdUseCase } from 'src/modules/tenant-user/use-cases/find-user-role-by-userId-and-tenantId.use-case';
import { RemoveUserFromTenantByUserIdAndTenantIdUseCase } from 'src/modules/tenant-user/use-cases/remove-user-from-tenant-by-userId-and-tenantId.use-case';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from 'src/modules/tenant-user/use-cases/validate-membership-by-userId-and-tenantId.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { TenantUserEntity } from 'src/modules/tenant-user/entities/tenant-user.entity';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';
import { ConflictException } from '@nestjs/common';

describe('TenantUserController (HTTP)', () => {
  let app: INestApplication;
  let addUserToTenantUseCase: { run: jest.Mock };
  let findMembershipByTenantIdAndUserIdUseCase: { run: jest.Mock };
  let removeUserFromTenantByUserIdAndTenantIdUseCase: { run: jest.Mock };

  const mockMembership: TenantUserEntity = {
    id: 'link-uuid',
    tenantId: 'tenant-uuid',
    userId: 'user-uuid',
    role: TenantUserRole.OWNER,
    status: TenantUserStatus.ACTIVE,
    createdAt: new Date('2021-01-01'),
  } as TenantUserEntity;

  beforeAll(async () => {
    addUserToTenantUseCase = { run: jest.fn() };
    findMembershipByTenantIdAndUserIdUseCase = { run: jest.fn() };
    removeUserFromTenantByUserIdAndTenantIdUseCase = { run: jest.fn() };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantUserController],
      providers: [
        { provide: AddUserToTenantUseCase, useValue: addUserToTenantUseCase },
        {
          provide: FindTenantUserByIdAndTenantUseCase,
          useValue: { run: jest.fn() },
        },
        {
          provide: FindMembershipByTenantIdAndUserIdUseCase,
          useValue: findMembershipByTenantIdAndUserIdUseCase,
        },
        {
          provide: FindUserRoleByUserIdAndTenantIdUseCase,
          useValue: { run: jest.fn() },
        },
        {
          provide: ValidateMembershipByUserIdAndTenantIdUseCase,
          useValue: { run: jest.fn() },
        },
        {
          provide: RemoveUserFromTenantByUserIdAndTenantIdUseCase,
          useValue: removeUserFromTenantByUserIdAndTenantIdUseCase,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(TenantInterceptor)
      .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tenants/:tenantId/members', () => {
    it('deve retornar 201 e o vinculo criado', () => {
      addUserToTenantUseCase.run.mockResolvedValue(mockMembership);
      return request(app.getHttpServer())
        .post('/tenants/tenant-uuid/members')
        .send({ userId: 'user-uuid', role: TenantUserRole.BARBER })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'link-uuid');
          expect(res.body).toHaveProperty('tenantId', 'tenant-uuid');
          expect(res.body).toHaveProperty('userId', 'user-uuid');
          expect(res.body).toHaveProperty('role', TenantUserRole.OWNER);
          expect(addUserToTenantUseCase.run).toHaveBeenCalledWith(
            'user-uuid',
            'tenant-uuid',
            TenantUserRole.BARBER,
          );
        });
    });
    it('deve retornar 409 quando usuario ja vinculado', () => {
      addUserToTenantUseCase.run.mockRejectedValue(
        new ConflictException('User is already linked to this tenant'),
      );
      return request(app.getHttpServer())
        .post('/tenants/tenant-uuid/members')
        .send({ userId: 'user-uuid', role: TenantUserRole.ADMIN })
        .expect(409);
    });
    it('deve retornar 404 quando tenant ou usuario nao existe', () => {
      addUserToTenantUseCase.run.mockRejectedValue(
        new NotFoundException('Tenant not found'),
      );
      return request(app.getHttpServer())
        .post('/tenants/tenant-uuid/members')
        .send({ userId: 'user-uuid', role: TenantUserRole.STAFF })
        .expect(404);
    });
  });

  describe('GET /tenants/:tenantId/members/:userId', () => {
    it('deve retornar 200 e o vinculo', () => {
      findMembershipByTenantIdAndUserIdUseCase.run.mockResolvedValue(
        mockMembership,
      );
      return request(app.getHttpServer())
        .get('/tenants/tenant-uuid/members/user-uuid')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'link-uuid');
          expect(res.body).toHaveProperty('role', TenantUserRole.OWNER);
          expect(
            findMembershipByTenantIdAndUserIdUseCase.run,
          ).toHaveBeenCalledWith('tenant-uuid', 'user-uuid');
        });
    });
    it('deve retornar 404 quando vinculo nao existe', () => {
      findMembershipByTenantIdAndUserIdUseCase.run.mockRejectedValue(
        new NotFoundException('No membership found'),
      );
      return request(app.getHttpServer())
        .get('/tenants/tenant-uuid/members/user-inexistente')
        .expect(404);
    });
  });

  describe('DELETE /tenants/:tenantId/members/:userId', () => {
    it('deve retornar 200 ao remover o vinculo', async () => {
      removeUserFromTenantByUserIdAndTenantIdUseCase.run.mockResolvedValue(
        undefined,
      );
      await request(app.getHttpServer())
        .delete('/tenants/tenant-uuid/members/user-uuid')
        .expect(200);
      expect(
        removeUserFromTenantByUserIdAndTenantIdUseCase.run,
      ).toHaveBeenCalledWith('user-uuid', 'tenant-uuid');
    });
    it('deve retornar 404 quando vinculo nao existe', () => {
      removeUserFromTenantByUserIdAndTenantIdUseCase.run.mockRejectedValue(
        new NotFoundException('No membership found'),
      );
      return request(app.getHttpServer())
        .delete('/tenants/tenant-uuid/members/user-inexistente')
        .expect(404);
    });
  });
});
