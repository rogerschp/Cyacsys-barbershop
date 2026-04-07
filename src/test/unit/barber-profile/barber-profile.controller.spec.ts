import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { BarberProfileController } from 'src/modules/barber-profile/barber-profile.controller';
import { CreateBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/create-barber-profile.use-case';
import { UpdateBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/update-barber-profile.use-case';
import { DeactivateBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/deactivate-barber-profile.use-case';
import { ListBarberProfilesUseCase } from 'src/modules/barber-profile/use-cases/list-barber-profiles.use-case';
import { GetBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/get-barber-profile.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from 'src/common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
describe('BarberProfileController (HTTP)', () => {
    let app: INestApplication;
    let createBarberProfileUseCase: jest.Mocked<CreateBarberProfileUseCase>;
    let updateBarberProfileUseCase: jest.Mocked<UpdateBarberProfileUseCase>;
    let deactivateBarberProfileUseCase: jest.Mocked<DeactivateBarberProfileUseCase>;
    let listBarberProfilesUseCase: jest.Mocked<ListBarberProfilesUseCase>;
    let getBarberProfileUseCase: jest.Mocked<GetBarberProfileUseCase>;
    const tenantId = 'tenant-uuid';
    const profileId = 'profile-uuid';
    const mockProfile: BarberProfileEntity = {
        id: profileId,
        tenantId,
        tenantUserId: 'tenant-user-uuid',
        displayName: 'João Barbeiro',
        bio: 'Bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        experienceYears: 5,
        isActive: true,
        createdAt: new Date('2021-01-01'),
        updatedAt: new Date('2021-01-01'),
        deletedAt: undefined,
    } as BarberProfileEntity;
    const createGuardMock = (role: string) => ({
        canActivate: (context: any) => {
            const req = context.switchToHttp().getRequest();
            req.user = { dbUser: { id: 'user-uuid-123' }, uid: 'firebase-uid' };
            req.tenantMembership = { role };
            return true;
        },
    });
    beforeAll(async () => {
        const mockCreate = { run: jest.fn() };
        const mockUpdate = { run: jest.fn() };
        const mockDeactivate = { run: jest.fn() };
        const mockList = { run: jest.fn() };
        const mockGet = { run: jest.fn() };
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [BarberProfileController],
            providers: [
                { provide: CreateBarberProfileUseCase, useValue: mockCreate },
                { provide: UpdateBarberProfileUseCase, useValue: mockUpdate },
                { provide: DeactivateBarberProfileUseCase, useValue: mockDeactivate },
                { provide: ListBarberProfilesUseCase, useValue: mockList },
                { provide: GetBarberProfileUseCase, useValue: mockGet },
            ],
        })
            .overrideGuard(BearerAuthGuard)
            .useValue(createGuardMock(TenantUserRole.ADMIN))
            .overrideInterceptor(TenantInterceptor)
            .useValue({ intercept: (_ctx: any, next: any) => next.handle() })
            .overrideGuard(TenantMembershipGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(TenantRolesGuard)
            .useValue({ canActivate: () => true })
            .compile();
        app = moduleFixture.createNestApplication();
        await app.init();
        createBarberProfileUseCase = moduleFixture.get(CreateBarberProfileUseCase) as jest.Mocked<CreateBarberProfileUseCase>;
        updateBarberProfileUseCase = moduleFixture.get(UpdateBarberProfileUseCase) as jest.Mocked<UpdateBarberProfileUseCase>;
        deactivateBarberProfileUseCase = moduleFixture.get(DeactivateBarberProfileUseCase) as jest.Mocked<DeactivateBarberProfileUseCase>;
        listBarberProfilesUseCase = moduleFixture.get(ListBarberProfilesUseCase) as jest.Mocked<ListBarberProfilesUseCase>;
        getBarberProfileUseCase = moduleFixture.get(GetBarberProfileUseCase) as jest.Mocked<GetBarberProfileUseCase>;
    });
    afterAll(async () => {
        await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /tenants/:tenantId/barber-profiles', () => {
        it('deve retornar 201 e o perfil criado', () => {
            createBarberProfileUseCase.run.mockResolvedValue(mockProfile);
            return request(app.getHttpServer())
                .post(`/tenants/${tenantId}/barber-profiles`)
                .send({
                tenantUserId: 'tenant-user-uuid',
                displayName: 'João Barbeiro',
                avatarUrl: 'https://example.com/avatar.jpg',
                experienceYears: 5,
                bio: 'Bio',
            })
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', profileId);
                expect(res.body).toHaveProperty('displayName', 'João Barbeiro');
                expect(createBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, expect.objectContaining({
                    tenantUserId: 'tenant-user-uuid',
                    displayName: 'João Barbeiro',
                    experienceYears: 5,
                }), 'user-uuid-123');
            });
        });
        it('deve retornar 400 quando regra de negócio violada', () => {
            createBarberProfileUseCase.run.mockRejectedValue(new BusinessRuleException('BARBER_PROFILE_ALREADY_EXISTS', 'Perfil já existe'));
            return request(app.getHttpServer())
                .post(`/tenants/${tenantId}/barber-profiles`)
                .send({
                tenantUserId: 'tenant-user-uuid',
                displayName: 'João',
                avatarUrl: 'https://example.com/a.jpg',
                experienceYears: 0,
            })
                .expect(400);
        });
        it('deve retornar 404 quando tenant user não existe', () => {
            createBarberProfileUseCase.run.mockRejectedValue(new NotFoundException('TENANT_USER_NOT_FOUND'));
            return request(app.getHttpServer())
                .post(`/tenants/${tenantId}/barber-profiles`)
                .send({
                tenantUserId: 'inexistente',
                displayName: 'João',
                avatarUrl: 'https://example.com/a.jpg',
                experienceYears: 0,
            })
                .expect(404);
        });
    });
    describe('GET /tenants/:tenantId/barber-profiles', () => {
        it('deve retornar 200 e lista de perfis', () => {
            listBarberProfilesUseCase.run.mockResolvedValue([mockProfile]);
            return request(app.getHttpServer())
                .get(`/tenants/${tenantId}/barber-profiles`)
                .expect(200)
                .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body[0]).toHaveProperty('id', profileId);
                expect(listBarberProfilesUseCase.run).toHaveBeenCalledWith(tenantId);
            });
        });
    });
    describe('GET /tenants/:tenantId/barber-profiles/:id', () => {
        it('deve retornar 200 e o perfil quando existe', () => {
            getBarberProfileUseCase.run.mockResolvedValue(mockProfile);
            return request(app.getHttpServer())
                .get(`/tenants/${tenantId}/barber-profiles/${profileId}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', profileId);
                expect(res.body).toHaveProperty('displayName', 'João Barbeiro');
                expect(getBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, profileId);
            });
        });
        it('deve retornar 404 quando perfil não existe', () => {
            getBarberProfileUseCase.run.mockRejectedValue(new NotFoundException('Barber profile not found'));
            return request(app.getHttpServer())
                .get(`/tenants/${tenantId}/barber-profiles/${profileId}`)
                .expect(404);
        });
    });
    describe('PATCH /tenants/:tenantId/barber-profiles/:id', () => {
        it('deve retornar 200 e o perfil atualizado', () => {
            const updated = { ...mockProfile, displayName: 'Nome Novo' };
            updateBarberProfileUseCase.run.mockResolvedValue(updated);
            return request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/barber-profiles/${profileId}`)
                .send({ displayName: 'Nome Novo' })
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('displayName', 'Nome Novo');
                expect(updateBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, profileId, { displayName: 'Nome Novo' }, 'user-uuid-123', TenantUserRole.ADMIN);
            });
        });
        it('deve retornar 404 quando perfil não existe', () => {
            updateBarberProfileUseCase.run.mockRejectedValue(new NotFoundException('Barber profile not found'));
            return request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/barber-profiles/${profileId}`)
                .send({ displayName: 'X' })
                .expect(404);
        });
    });
    describe('PATCH /tenants/:tenantId/barber-profiles/:id/deactivate', () => {
        it('deve retornar 200 e o perfil desativado', () => {
            const deactivated = { ...mockProfile, isActive: false };
            deactivateBarberProfileUseCase.run.mockResolvedValue(deactivated);
            return request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/barber-profiles/${profileId}/deactivate`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('isActive', false);
                expect(deactivateBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, profileId, 'user-uuid-123');
            });
        });
        it('deve retornar 404 quando perfil não existe', () => {
            deactivateBarberProfileUseCase.run.mockRejectedValue(new NotFoundException('Barber profile not found'));
            return request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/barber-profiles/${profileId}/deactivate`)
                .expect(404);
        });
    });
});
