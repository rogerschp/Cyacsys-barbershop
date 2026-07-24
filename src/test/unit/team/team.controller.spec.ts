import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { TeamController } from 'src/modules/team/controllers/team.controller';
import { OnboardTeamMemberUseCase } from 'src/modules/team/use-cases/onboard-team-member.use-case';
import { ListTeamMembersUseCase } from 'src/modules/team/use-cases/list-team-members.use-case';
import { ListTeamInvitationsUseCase } from 'src/modules/team/use-cases/list-team-invitations.use-case';
import { CancelTeamInvitationUseCase } from 'src/modules/team/use-cases/cancel-team-invitation.use-case';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantInvitationStatus } from 'src/modules/team/enums/tenant-invitation-status.enum';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';

describe('TeamController (HTTP)', () => {
  let app: INestApplication;
  const onboard = { run: jest.fn() };
  const listMembers = { run: jest.fn() };
  const listInvitations = { run: jest.fn() };
  const cancel = { run: jest.fn() };
  let rolesGuardAllows = true;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [
        { provide: OnboardTeamMemberUseCase, useValue: onboard },
        { provide: ListTeamMembersUseCase, useValue: listMembers },
        { provide: ListTeamInvitationsUseCase, useValue: listInvitations },
        { provide: CancelTeamInvitationUseCase, useValue: cancel },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          const req = context.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string } };
          };
          req.user = { dbUser: { id: 'owner-1' } };
          return true;
        },
      })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({
        canActivate: () => {
          if (!rolesGuardAllows) {
            throw new TenantForbiddenException(
              'INSUFFICIENT_ROLE',
              'Insufficient role',
              { tenantId: 'tenant-1', path: '/tenants/tenant-1/team' },
            );
          }
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    rolesGuardAllows = true;
  });

  it('POST /team/onboard retorna 201', () => {
    onboard.run.mockResolvedValue({
      kind: 'INVITATION_CREATED',
      invitation: {
        id: 'inv-1',
        email: 'new@b.com',
        role: TenantUserRole.BARBER,
        status: TenantInvitationStatus.PENDING,
      },
    });

    return request(app.getHttpServer())
      .post('/tenants/tenant-1/team/onboard')
      .send({ email: 'new@b.com', role: TenantUserRole.BARBER })
      .expect(201)
      .expect((res) => {
        expect(res.body.kind).toBe('INVITATION_CREATED');
        expect(onboard.run).toHaveBeenCalledWith({
          tenantId: 'tenant-1',
          email: 'new@b.com',
          role: TenantUserRole.BARBER,
          createdByUserId: 'owner-1',
        });
      });
  });

  it('GET /team lista membros', () => {
    listMembers.run.mockResolvedValue([{ membershipId: 'tu-1' }]);
    return request(app.getHttpServer())
      .get('/tenants/tenant-1/team')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(listMembers.run).toHaveBeenCalledWith('tenant-1');
      });
  });

  it('GET /team/invitations filtra status', () => {
    listInvitations.run.mockResolvedValue([]);
    return request(app.getHttpServer())
      .get('/tenants/tenant-1/team/invitations')
      .query({ status: TenantInvitationStatus.PENDING })
      .expect(200)
      .expect(() => {
        expect(listInvitations.run).toHaveBeenCalledWith(
          'tenant-1',
          TenantInvitationStatus.PENDING,
        );
      });
  });

  it('DELETE /team/invitations/:id cancela', () => {
    cancel.run.mockResolvedValue({
      id: 'inv-1',
      status: TenantInvitationStatus.CANCELLED,
    });
    return request(app.getHttpServer())
      .delete('/tenants/tenant-1/team/invitations/inv-1')
      .expect(200)
      .expect(() => {
        expect(cancel.run).toHaveBeenCalledWith('tenant-1', 'inv-1');
      });
  });

  it('retorna 403 quando role insuficiente', () => {
    rolesGuardAllows = false;
    return request(app.getHttpServer())
      .post('/tenants/tenant-1/team/onboard')
      .send({ email: 'x@y.com', role: TenantUserRole.STAFF })
      .expect(403);
  });
});
