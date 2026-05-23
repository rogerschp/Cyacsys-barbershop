import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TenantProfessionalController } from 'src/modules/tenant-professional/tenant-professional.controller';
import { LinkProfessionalToTenantUseCase } from 'src/modules/tenant-professional/use-cases/link-professional-to-tenant.use-case';
import { LinkMyProfessionalToTenantUseCase } from 'src/modules/tenant-professional/use-cases/link-my-professional-to-tenant.use-case';
import { ListTenantProfessionalsUseCase } from 'src/modules/tenant-professional/use-cases/list-tenant-professionals.use-case';
import { GetTenantProfessionalUseCase } from 'src/modules/tenant-professional/use-cases/get-tenant-professional.use-case';
import { UpdateTenantProfessionalStatusUseCase } from 'src/modules/tenant-professional/use-cases/update-tenant-professional-status.use-case';
import { LeaveTenantProfessionalUseCase } from 'src/modules/tenant-professional/use-cases/leave-tenant-professional.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';
import { ProfessionalType } from 'src/modules/professional-profile/entities/professional-type.enum';
import { BookingMode } from 'src/modules/professional-profile/entities/booking-mode.enum';

describe('TenantProfessionalController (HTTP)', () => {
  let app: INestApplication;
  let listUseCase: jest.Mocked<ListTenantProfessionalsUseCase>;
  let linkUseCase: jest.Mocked<LinkProfessionalToTenantUseCase>;
  let linkMineUseCase: jest.Mocked<LinkMyProfessionalToTenantUseCase>;
  let getUseCase: jest.Mocked<GetTenantProfessionalUseCase>;
  let updateStatusUseCase: jest.Mocked<UpdateTenantProfessionalStatusUseCase>;
  let leaveUseCase: jest.Mocked<LeaveTenantProfessionalUseCase>;

  const tenantId = 'tenant-uuid';
  const mockLink = {
    id: 'tp-uuid',
    tenantId,
    professionalProfileId: 'profile-uuid',
    role: TenantUserRole.BARBER,
    status: TenantProfessionalStatus.ACTIVE,
    joinedAt: new Date('2021-01-01'),
    leftAt: null,
    createdAt: new Date('2021-01-01'),
    professionalProfile: {
      id: 'profile-uuid',
      userId: 'user-uuid-123',
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
    },
  };

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
          req.user = { dbUser: { id: 'user-uuid-123' } };
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
    listUseCase = moduleFixture.get(ListTenantProfessionalsUseCase);
    linkUseCase = moduleFixture.get(LinkProfessionalToTenantUseCase);
    linkMineUseCase = moduleFixture.get(LinkMyProfessionalToTenantUseCase);
    getUseCase = moduleFixture.get(GetTenantProfessionalUseCase);
    updateStatusUseCase = moduleFixture.get(
      UpdateTenantProfessionalStatusUseCase,
    );
    leaveUseCase = moduleFixture.get(LeaveTenantProfessionalUseCase);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tenants/:tenantId/tenant-professionals', async () => {
    listUseCase.run.mockResolvedValue([mockLink as never]);
    const res = await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/tenant-professionals`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].professionalProfile.displayName).toBe('João Silva');
    expect(listUseCase.run).toHaveBeenCalledWith(tenantId, {
      activeOnly: false,
    });
  });

  it('GET com activeOnly=true repassa filtro', async () => {
    listUseCase.run.mockResolvedValue([]);
    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/tenant-professionals`)
      .query({ activeOnly: 'true' })
      .expect(200);
    expect(listUseCase.run).toHaveBeenCalledWith(tenantId, {
      activeOnly: true,
    });
  });

  it('POST /tenants/:tenantId/tenant-professionals/me', async () => {
    linkMineUseCase.run.mockResolvedValue(mockLink as never);
    const res = await request(app.getHttpServer())
      .post(`/tenants/${tenantId}/tenant-professionals/me`)
      .expect(201);
    expect(res.body.id).toBe('tp-uuid');
    expect(linkMineUseCase.run).toHaveBeenCalledWith(tenantId, 'user-uuid-123');
  });

  it('POST /tenants/:tenantId/tenant-professionals', async () => {
    linkUseCase.run.mockResolvedValue(mockLink as never);
    const res = await request(app.getHttpServer())
      .post(`/tenants/${tenantId}/tenant-professionals`)
      .send({
        professionalProfileId: 'profile-uuid',
        role: TenantUserRole.BARBER,
      })
      .expect(201);
    expect(res.body.id).toBe('tp-uuid');
    expect(linkUseCase.run).toHaveBeenCalledWith(
      tenantId,
      { professionalProfileId: 'profile-uuid', role: TenantUserRole.BARBER },
      'user-uuid-123',
    );
  });

  it('GET /tenants/:tenantId/tenant-professionals/:id', async () => {
    getUseCase.run.mockResolvedValue(mockLink as never);
    const res = await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/tenant-professionals/tp-uuid`)
      .expect(200);
    expect(res.body.id).toBe('tp-uuid');
    expect(getUseCase.run).toHaveBeenCalledWith(tenantId, 'tp-uuid');
  });

  it('PATCH /tenants/:tenantId/tenant-professionals/:id/status', async () => {
    updateStatusUseCase.run.mockResolvedValue(mockLink as never);
    await request(app.getHttpServer())
      .patch(`/tenants/${tenantId}/tenant-professionals/tp-uuid/status`)
      .send({ status: TenantProfessionalStatus.INACTIVE })
      .expect(200);
    expect(updateStatusUseCase.run).toHaveBeenCalledWith(
      tenantId,
      'tp-uuid',
      { status: TenantProfessionalStatus.INACTIVE },
      'user-uuid-123',
    );
  });

  it('PATCH /tenants/:tenantId/tenant-professionals/:id/leave', async () => {
    leaveUseCase.run.mockResolvedValue({
      ...mockLink,
      status: TenantProfessionalStatus.LEFT,
    } as never);
    await request(app.getHttpServer())
      .patch(`/tenants/${tenantId}/tenant-professionals/tp-uuid/leave`)
      .expect(200);
    expect(leaveUseCase.run).toHaveBeenCalledWith(
      tenantId,
      'tp-uuid',
      'user-uuid-123',
      TenantUserRole.ADMIN,
    );
  });
});
