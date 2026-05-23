import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TenantProfessionalController } from '../modules/tenant-professional/tenant-professional.controller';
import { LinkProfessionalToTenantUseCase } from '../modules/tenant-professional/use-cases/link-professional-to-tenant.use-case';
import { LinkMyProfessionalToTenantUseCase } from '../modules/tenant-professional/use-cases/link-my-professional-to-tenant.use-case';
import { ListTenantProfessionalsUseCase } from '../modules/tenant-professional/use-cases/list-tenant-professionals.use-case';
import { GetTenantProfessionalUseCase } from '../modules/tenant-professional/use-cases/get-tenant-professional.use-case';
import { UpdateTenantProfessionalStatusUseCase } from '../modules/tenant-professional/use-cases/update-tenant-professional-status.use-case';
import { LeaveTenantProfessionalUseCase } from '../modules/tenant-professional/use-cases/leave-tenant-professional.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantResolverGuard } from '../common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { TenantUserRole } from '../modules/tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from '../modules/tenant-professional/entities/tenant-professional-status.enum';
import { ProfessionalType } from '../modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from '../modules/professional-profile/entities/booking-mode.enum';
import { TenantProfessionalEntity } from '../modules/tenant-professional/entities/tenant-professional.entity';
import { ProfessionalProfileEntity } from '../modules/professional-profile/entities/professional-profile.entity';

describe('TenantProfessionalController (e2e)', () => {
  let app: INestApplication;
  let listUseCase: jest.Mocked<ListTenantProfessionalsUseCase>;
  let linkMineUseCase: jest.Mocked<LinkMyProfessionalToTenantUseCase>;

  const tenantId = 'tenant-e2e-uuid';
  const profileId = 'profile-e2e-uuid';
  const linkId = 'tp-e2e-uuid';

  const mockProfessionalProfile = {
    id: profileId,
    userId: 'user-e2e-123',
    displayName: 'João Silva',
    bio: null,
    avatarUrl: 'https://example.com/avatar.jpg',
    professionalType: ProfessionalType.BARBER,
    bookingMode: BookingMode.DIRECT_BOOKING,
    whatsappNumber: null,
    instagramUsername: null,
    experienceYears: 5,
    isActive: true,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
  } as ProfessionalProfileEntity;

  const mockLink: TenantProfessionalEntity = {
    id: linkId,
    tenantId,
    professionalProfileId: profileId,
    role: TenantUserRole.BARBER,
    status: TenantProfessionalStatus.ACTIVE,
    joinedAt: new Date('2021-01-01'),
    leftAt: null,
    createdAt: new Date('2021-01-01'),
    professionalProfile: mockProfessionalProfile,
  } as TenantProfessionalEntity;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantProfessionalController],
      providers: [
        {
          provide: LinkProfessionalToTenantUseCase,
          useValue: { run: jest.fn() },
        },
        {
          provide: LinkMyProfessionalToTenantUseCase,
          useValue: { run: jest.fn() },
        },
        {
          provide: ListTenantProfessionalsUseCase,
          useValue: { run: jest.fn() },
        },
        { provide: GetTenantProfessionalUseCase, useValue: { run: jest.fn() } },
        {
          provide: UpdateTenantProfessionalStatusUseCase,
          useValue: { run: jest.fn() },
        },
        {
          provide: LeaveTenantProfessionalUseCase,
          useValue: { run: jest.fn() },
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          const req = context.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string } };
            tenantMembership?: { role: string };
          };
          req.user = { dbUser: { id: 'user-e2e-123' } };
          req.tenantMembership = { role: TenantUserRole.ADMIN };
          return true;
        },
      })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    listUseCase = moduleFixture.get(
      ListTenantProfessionalsUseCase,
    ) as jest.Mocked<ListTenantProfessionalsUseCase>;
    linkMineUseCase = moduleFixture.get(
      LinkMyProfessionalToTenantUseCase,
    ) as jest.Mocked<LinkMyProfessionalToTenantUseCase>;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    listUseCase.run.mockResolvedValue([mockLink]);
    linkMineUseCase.run.mockResolvedValue(mockLink);
  });

  describe('GET /tenants/:tenantId/tenant-professionals', () => {
    it('deve retornar lista com professionalProfile aninhado', () => {
      return request(app.getHttpServer())
        .get(`/tenants/${tenantId}/tenant-professionals`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toMatchObject({
            id: linkId,
            tenantId,
            professionalProfileId: profileId,
            status: TenantProfessionalStatus.ACTIVE,
          });
          expect(res.body[0].professionalProfile).toMatchObject({
            id: profileId,
            displayName: 'João Silva',
            professionalType: ProfessionalType.BARBER,
          });
          expect(listUseCase.run).toHaveBeenCalledWith(tenantId, {
            activeOnly: false,
          });
        });
    });

    it('deve repassar activeOnly=true', () => {
      return request(app.getHttpServer())
        .get(`/tenants/${tenantId}/tenant-professionals?activeOnly=true`)
        .expect(200)
        .expect(() => {
          expect(listUseCase.run).toHaveBeenCalledWith(tenantId, {
            activeOnly: true,
          });
        });
    });
  });

  describe('POST /tenants/:tenantId/tenant-professionals/me', () => {
    it('deve retornar 201 com vínculo e perfil global', () => {
      return request(app.getHttpServer())
        .post(`/tenants/${tenantId}/tenant-professionals/me`)
        .expect(201)
        .expect((res) => {
          expect(res.body.professionalProfile.id).toBe(profileId);
          expect(linkMineUseCase.run).toHaveBeenCalledWith(
            tenantId,
            'user-e2e-123',
          );
        });
    });
  });
});
