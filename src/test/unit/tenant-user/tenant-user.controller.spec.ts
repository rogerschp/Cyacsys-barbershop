import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { TenantUserController } from 'src/modules/tenant-user/tenant-user.controller';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { TenantUserEntity } from 'src/modules/tenant-user/entities/tenant-user.entity';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';
import { ConflictException } from '@nestjs/common';
describe('TenantUserController (HTTP)', () => {
    let app: INestApplication;
    let tenantUserService: jest.Mocked<TenantUserService>;
    const mockMembership: TenantUserEntity = {
        id: 'link-uuid',
        tenantId: 'tenant-uuid',
        userId: 'user-uuid',
        role: TenantUserRole.OWNER,
        status: TenantUserStatus.ACTIVE,
        createdAt: new Date('2021-01-01'),
    } as TenantUserEntity;
    beforeAll(async () => {
        const mockService = {
            addUserToTenant: jest.fn(),
            getMembership: jest.fn(),
            removeUserFromTenant: jest.fn(),
        };
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [TenantUserController],
            providers: [{ provide: TenantUserService, useValue: mockService }],
        })
            .overrideGuard(BearerAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideInterceptor(TenantInterceptor)
            .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
            .overrideGuard(TenantMembershipGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(TenantRolesGuard)
            .useValue({ canActivate: () => true })
            .compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        tenantUserService = moduleFixture.get(TenantUserService) as jest.Mocked<TenantUserService>;
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /tenants/:tenantId/members', () => {
        it('deve retornar 201 e o vinculo criado', () => {
            tenantUserService.addUserToTenant.mockResolvedValue(mockMembership);
            return request(app.getHttpServer())
                .post('/tenants/tenant-uuid/members')
                .send({ userId: 'user-uuid', role: TenantUserRole.BARBER })
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', 'link-uuid');
                expect(res.body).toHaveProperty('tenantId', 'tenant-uuid');
                expect(res.body).toHaveProperty('userId', 'user-uuid');
                expect(res.body).toHaveProperty('role', TenantUserRole.OWNER);
                expect(tenantUserService.addUserToTenant).toHaveBeenCalledWith('user-uuid', 'tenant-uuid', TenantUserRole.BARBER);
            });
        });
        it('deve retornar 409 quando usuario ja vinculado', () => {
            tenantUserService.addUserToTenant.mockRejectedValue(new ConflictException('User is already linked to this tenant'));
            return request(app.getHttpServer())
                .post('/tenants/tenant-uuid/members')
                .send({ userId: 'user-uuid', role: TenantUserRole.ADMIN })
                .expect(409);
        });
        it('deve retornar 404 quando tenant ou usuario nao existe', () => {
            tenantUserService.addUserToTenant.mockRejectedValue(new NotFoundException('Tenant not found'));
            return request(app.getHttpServer())
                .post('/tenants/tenant-uuid/members')
                .send({ userId: 'user-uuid', role: TenantUserRole.STAFF })
                .expect(404);
        });
    });
    describe('GET /tenants/:tenantId/members/:userId', () => {
        it('deve retornar 200 e o vinculo', () => {
            tenantUserService.getMembership.mockResolvedValue(mockMembership);
            return request(app.getHttpServer())
                .get('/tenants/tenant-uuid/members/user-uuid')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', 'link-uuid');
                expect(res.body).toHaveProperty('role', TenantUserRole.OWNER);
                expect(tenantUserService.getMembership).toHaveBeenCalledWith('tenant-uuid', 'user-uuid');
            });
        });
        it('deve retornar 404 quando vinculo nao existe', () => {
            tenantUserService.getMembership.mockRejectedValue(new NotFoundException('No membership found'));
            return request(app.getHttpServer())
                .get('/tenants/tenant-uuid/members/user-inexistente')
                .expect(404);
        });
    });
    describe('DELETE /tenants/:tenantId/members/:userId', () => {
        it('deve retornar 200 ao remover o vinculo', async () => {
            tenantUserService.removeUserFromTenant.mockResolvedValue(undefined);
            await request(app.getHttpServer())
                .delete('/tenants/tenant-uuid/members/user-uuid')
                .expect(200);
            expect(tenantUserService.removeUserFromTenant).toHaveBeenCalledWith('user-uuid', 'tenant-uuid');
        });
        it('deve retornar 404 quando vinculo nao existe', () => {
            tenantUserService.removeUserFromTenant.mockRejectedValue(new NotFoundException('No membership found'));
            return request(app.getHttpServer())
                .delete('/tenants/tenant-uuid/members/user-inexistente')
                .expect(404);
        });
    });
});
