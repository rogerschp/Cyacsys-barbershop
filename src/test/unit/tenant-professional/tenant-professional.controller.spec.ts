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

describe('TenantProfessionalController (HTTP)', () => {
  let app: INestApplication;
  let listUseCase: jest.Mocked<ListTenantProfessionalsUseCase>;

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
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantProfessionalController],
      providers: [
        { provide: LinkProfessionalToTenantUseCase, useValue: { run: jest.fn() } },
        { provide: LinkMyProfessionalToTenantUseCase, useValue: { run: jest.fn() } },
        { provide: ListTenantProfessionalsUseCase, useValue: { run: jest.fn() } },
        { provide: GetTenantProfessionalUseCase, useValue: { run: jest.fn() } },
        {
          provide: UpdateTenantProfessionalStatusUseCase,
          useValue: { run: jest.fn() },
        },
        { provide: LeaveTenantProfessionalUseCase, useValue: { run: jest.fn() } },
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
    listUseCase = moduleFixture.get(
      ListTenantProfessionalsUseCase,
    ) as jest.Mocked<ListTenantProfessionalsUseCase>;
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
    expect(listUseCase.run).toHaveBeenCalledWith(tenantId, {
      activeOnly: false,
    });
  });
});
