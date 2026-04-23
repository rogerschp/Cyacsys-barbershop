import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BarberProfileController } from '../modules/barber-profile/barber-profile.controller';
import { CreateBarberProfileUseCase } from '../modules/barber-profile/use-cases/create-barber-profile.use-case';
import { UpdateBarberProfileUseCase } from '../modules/barber-profile/use-cases/update-barber-profile.use-case';
import { DeactivateBarberProfileUseCase } from '../modules/barber-profile/use-cases/deactivate-barber-profile.use-case';
import { ListBarberProfilesUseCase } from '../modules/barber-profile/use-cases/list-barber-profiles.use-case';
import { GetBarberProfileUseCase } from '../modules/barber-profile/use-cases/get-barber-profile.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantInterceptor } from '../common/interceptors/tenant.interceptor';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { BarberProfileEntity } from '../modules/barber-profile/entities/barber-profile.entity';
import { TenantUserRole } from '../modules/tenant-user/entities/tenant-user-role.enum';
describe('BarberProfileController (e2e)', () => {
    let app: INestApplication;
    let createBarberProfileUseCase: jest.Mocked<CreateBarberProfileUseCase>;
    let updateBarberProfileUseCase: jest.Mocked<UpdateBarberProfileUseCase>;
    let deactivateBarberProfileUseCase: jest.Mocked<DeactivateBarberProfileUseCase>;
    let listBarberProfilesUseCase: jest.Mocked<ListBarberProfilesUseCase>;
    let getBarberProfileUseCase: jest.Mocked<GetBarberProfileUseCase>;
    const tenantId = 'tenant-e2e-uuid';
    const profileId = 'profile-e2e-uuid';
    const mockProfile: BarberProfileEntity = {
        id: profileId,
        tenantId,
        tenantUserId: 'tenant-user-e2e-uuid',
        displayName: 'João Barbeiro',
        bio: 'Especialista em cortes',
        avatarUrl: 'https://example.com/avatar.jpg',
        experienceYears: 5,
        isActive: true,
        createdAt: new Date('2021-01-01'),
        updatedAt: new Date('2021-01-01'),
        deletedAt: undefined,
    } as BarberProfileEntity;
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
            .useValue({
            canActivate: (context: any) => {
                const req = context.switchToHttp().getRequest();
                req.user = { dbUser: { id: 'user-e2e-123' }, uid: 'firebase-uid' };
                req.tenantMembership = { role: TenantUserRole.ADMIN };
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
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
        }));
        await app.init();
        createBarberProfileUseCase = moduleFixture.get(CreateBarberProfileUseCase) as jest.Mocked<CreateBarberProfileUseCase>;
        updateBarberProfileUseCase = moduleFixture.get(UpdateBarberProfileUseCase) as jest.Mocked<UpdateBarberProfileUseCase>;
        deactivateBarberProfileUseCase = moduleFixture.get(DeactivateBarberProfileUseCase) as jest.Mocked<DeactivateBarberProfileUseCase>;
        listBarberProfilesUseCase = moduleFixture.get(ListBarberProfilesUseCase) as jest.Mocked<ListBarberProfilesUseCase>;
        getBarberProfileUseCase = moduleFixture.get(GetBarberProfileUseCase) as jest.Mocked<GetBarberProfileUseCase>;
    });
    afterAll(async () => {
        if (app)
            await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
        createBarberProfileUseCase.run.mockResolvedValue(mockProfile);
        updateBarberProfileUseCase.run.mockResolvedValue(mockProfile);
        deactivateBarberProfileUseCase.run.mockResolvedValue({
            ...mockProfile,
            isActive: false,
        });
        listBarberProfilesUseCase.run.mockResolvedValue([mockProfile]);
        getBarberProfileUseCase.run.mockResolvedValue(mockProfile);
    });
    describe('POST /tenants/:tenantId/barber-profiles', () => {
        it('deve retornar 201 e o perfil criado', () => {
            return request(app.getHttpServer())
                .post(`/tenants/${tenantId}/barber-profiles`)
                .send({
                tenantUserId: 'tenant-user-e2e-uuid',
                displayName: 'João Barbeiro',
                avatarUrl: 'https://example.com/avatar.jpg',
                experienceYears: 5,
                bio: 'Especialista em cortes',
            })
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', profileId);
                expect(res.body).toHaveProperty('displayName', 'João Barbeiro');
                expect(res.body).toHaveProperty('tenantId', tenantId);
                expect(res.body).toHaveProperty('experienceYears', 5);
                expect(createBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, expect.objectContaining({
                    tenantUserId: 'tenant-user-e2e-uuid',
                    displayName: 'João Barbeiro',
                    experienceYears: 5,
                }), 'user-e2e-123');
            });
        });
        it('deve retornar 400 quando body inválido (campos obrigatórios faltando)', () => {
            return request(app.getHttpServer())
                .post(`/tenants/${tenantId}/barber-profiles`)
                .send({ displayName: 'João' })
                .expect(400);
        });
    });
    describe('GET /tenants/:tenantId/barber-profiles', () => {
        it('deve retornar 200 e lista de perfis', () => {
            return request(app.getHttpServer())
                .get(`/tenants/${tenantId}/barber-profiles`)
                .expect(200)
                .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body[0]).toHaveProperty('id', profileId);
                expect(res.body[0]).toHaveProperty('displayName', 'João Barbeiro');
                expect(listBarberProfilesUseCase.run).toHaveBeenCalledWith(tenantId);
            });
        });
    });
    describe('GET /tenants/:tenantId/barber-profiles/:id', () => {
        it('deve retornar 200 e o perfil quando existe', () => {
            return request(app.getHttpServer())
                .get(`/tenants/${tenantId}/barber-profiles/${profileId}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', profileId);
                expect(res.body).toHaveProperty('displayName', 'João Barbeiro');
                expect(getBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, profileId);
            });
        });
    });
    describe('PATCH /tenants/:tenantId/barber-profiles/:id', () => {
        it('deve retornar 200 e o perfil atualizado', () => {
            return request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/barber-profiles/${profileId}`)
                .send({ displayName: 'Nome Atualizado' })
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('id', profileId);
                expect(updateBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, profileId, { displayName: 'Nome Atualizado' }, 'user-e2e-123', TenantUserRole.ADMIN);
            });
        });
    });
    describe('PATCH /tenants/:tenantId/barber-profiles/:id/deactivate', () => {
        it('deve retornar 200 e o perfil desativado', () => {
            return request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/barber-profiles/${profileId}/deactivate`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('isActive', false);
                expect(deactivateBarberProfileUseCase.run).toHaveBeenCalledWith(tenantId, profileId, 'user-e2e-123');
            });
        });
    });
});
