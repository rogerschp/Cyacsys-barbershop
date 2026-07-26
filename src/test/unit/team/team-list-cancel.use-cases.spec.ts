import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { NotFoundException } from '@nestjs/common';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantInvitationStatus } from 'src/modules/team/enums/tenant-invitation-status.enum';
import { CancelTeamInvitationUseCase } from 'src/modules/team/use-cases/cancel-team-invitation.use-case';
import { ListTeamInvitationsUseCase } from 'src/modules/team/use-cases/list-team-invitations.use-case';
import { ListTeamMembersUseCase } from 'src/modules/team/use-cases/list-team-members.use-case';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';

describe('ListTeamMembersUseCase', () => {
  it('lista membros mapeados', async () => {
    const findTenantByIdUseCase = { run: jest.fn().mockResolvedValue({}) };
    const tenantUserRepository = {
      listByTenantId: jest.fn().mockResolvedValue([
        {
          id: 'tu-1',
          userId: 'u-1',
          role: TenantUserRole.ADMIN,
          status: TenantUserStatus.ACTIVE,
          user: { email: 'a@b.com', name: 'Ana' },
        },
      ]),
    };
    const useCase = new ListTeamMembersUseCase(
      findTenantByIdUseCase as never,
      tenantUserRepository as never,
    );

    const result = await useCase.run('tenant-1');
    expect(result).toEqual([
      {
        membershipId: 'tu-1',
        userId: 'u-1',
        email: 'a@b.com',
        name: 'Ana',
        role: TenantUserRole.ADMIN,
        status: TenantUserStatus.ACTIVE,
      },
    ]);
  });
});

describe('ListTeamInvitationsUseCase', () => {
  it('lista convites sem token', async () => {
    const findTenantByIdUseCase = { run: jest.fn().mockResolvedValue({}) };
    const invitationRepository = {
      listByTenant: jest.fn().mockResolvedValue([
        {
          id: 'inv-1',
          tenantId: 'tenant-1',
          email: 'x@y.com',
          role: TenantUserRole.STAFF,
          status: TenantInvitationStatus.PENDING,
          token: 'secret',
          expiresAt: new Date('2026-08-01T00:00:00.000Z'),
          acceptedAt: null,
          createdByUserId: 'owner-1',
          createdAt: new Date('2026-07-24T00:00:00.000Z'),
        },
      ]),
    };
    const useCase = new ListTeamInvitationsUseCase(
      findTenantByIdUseCase as never,
      invitationRepository as never,
    );

    const result = await useCase.run(
      'tenant-1',
      TenantInvitationStatus.PENDING,
    );
    expect(result[0]).not.toHaveProperty('token');
    expect(result[0].email).toBe('x@y.com');
    expect(invitationRepository.listByTenant).toHaveBeenCalledWith(
      'tenant-1',
      TenantInvitationStatus.PENDING,
    );
  });
});

describe('CancelTeamInvitationUseCase', () => {
  const findTenantByIdUseCase = { run: jest.fn().mockResolvedValue({}) };
  const invitationRepository = {
    findByIdAndTenant: jest.fn(),
    updateStatus: jest.fn(),
  };
  const useCase = new CancelTeamInvitationUseCase(
    findTenantByIdUseCase as never,
    invitationRepository as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('cancela convite PENDING', async () => {
    invitationRepository.findByIdAndTenant.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      email: 'x@y.com',
      role: TenantUserRole.STAFF,
      status: TenantInvitationStatus.PENDING,
      expiresAt: new Date('2026-08-01T00:00:00.000Z'),
      acceptedAt: null,
      createdByUserId: 'owner-1',
      createdAt: new Date('2026-07-24T00:00:00.000Z'),
    });
    invitationRepository.updateStatus.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      email: 'x@y.com',
      role: TenantUserRole.STAFF,
      status: TenantInvitationStatus.CANCELLED,
      expiresAt: new Date('2026-08-01T00:00:00.000Z'),
      acceptedAt: null,
      createdByUserId: 'owner-1',
      createdAt: new Date('2026-07-24T00:00:00.000Z'),
    });

    const result = await useCase.run('tenant-1', 'inv-1');
    expect(result.status).toBe(TenantInvitationStatus.CANCELLED);
    expect(invitationRepository.updateStatus).toHaveBeenCalledWith(
      'inv-1',
      TenantInvitationStatus.CANCELLED,
    );
  });

  it('404 quando convite não existe', async () => {
    invitationRepository.findByIdAndTenant.mockResolvedValue(null);
    await expect(useCase.run('tenant-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejeita cancelamento se não PENDING', async () => {
    invitationRepository.findByIdAndTenant.mockResolvedValue({
      id: 'inv-1',
      status: TenantInvitationStatus.CANCELLED,
    });
    await expect(useCase.run('tenant-1', 'inv-1')).rejects.toBeInstanceOf(
      BusinessRuleException,
    );
  });
});
