import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';
import { TenantInvitationStatus } from 'src/modules/team/enums/tenant-invitation-status.enum';
import { OnboardTeamMemberUseCase } from 'src/modules/team/use-cases/onboard-team-member.use-case';

describe('OnboardTeamMemberUseCase', () => {
  const findTenantByIdUseCase = {
    run: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Shop' }),
  };
  const userRepository = { findByEmail: jest.fn() };
  const tenantUserRepository = { findByTenantAndUser: jest.fn() };
  const invitationRepository = {
    findPendingByTenantAndEmail: jest.fn(),
    create: jest.fn(),
  };
  const addUserToTenantUseCase = { run: jest.fn() };
  const linkProfessionalToTenantUseCase = { run: jest.fn() };
  const dispatchNotificationUseCase = { run: jest.fn() };

  const useCase = new OnboardTeamMemberUseCase(
    findTenantByIdUseCase as never,
    userRepository as never,
    tenantUserRepository as never,
    invitationRepository as never,
    addUserToTenantUseCase as never,
    linkProfessionalToTenantUseCase as never,
    dispatchNotificationUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    invitationRepository.findPendingByTenantAndEmail.mockResolvedValue(null);
  });

  it('adiciona membro existente e linka BARBER com profile ativo', async () => {
    const user = {
      id: 'user-1',
      email: 'a@b.com',
      name: 'Ana',
      professionalProfile: { id: 'pp-1', isActive: true },
    };
    userRepository.findByEmail.mockResolvedValue(user);
    tenantUserRepository.findByTenantAndUser.mockResolvedValue(null);
    addUserToTenantUseCase.run.mockResolvedValue({
      id: 'tu-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      role: TenantUserRole.BARBER,
      status: TenantUserStatus.ACTIVE,
    });
    linkProfessionalToTenantUseCase.run.mockResolvedValue({ id: 'tp-1' });

    const result = await useCase.run({
      tenantId: 'tenant-1',
      email: 'A@B.com',
      role: TenantUserRole.BARBER,
      createdByUserId: 'owner-1',
    });

    expect(result.kind).toBe('MEMBER_ADDED');
    expect(result.member?.email).toBe('a@b.com');
    expect(result.tenantProfessionalId).toBe('tp-1');
    expect(dispatchNotificationUseCase.run).not.toHaveBeenCalled();
  });

  it('cria convite e dispara TEAM_INVITATION quando email não existe', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    invitationRepository.create.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      email: 'new@b.com',
      role: TenantUserRole.STAFF,
      status: TenantInvitationStatus.PENDING,
      token: 'secret',
      expiresAt: new Date('2026-08-01T00:00:00.000Z'),
      acceptedAt: null,
      createdByUserId: 'owner-1',
      createdAt: new Date('2026-07-24T00:00:00.000Z'),
    });

    const result = await useCase.run({
      tenantId: 'tenant-1',
      email: 'new@b.com',
      role: TenantUserRole.STAFF,
      createdByUserId: 'owner-1',
    });

    expect(result.kind).toBe('INVITATION_CREATED');
    expect(result.invitation).toMatchObject({
      id: 'inv-1',
      email: 'new@b.com',
    });
    expect(result.invitation).not.toHaveProperty('token');
    expect(dispatchNotificationUseCase.run).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NotificationEvent.TEAM_INVITATION,
        to: 'new@b.com',
        payload: expect.objectContaining({
          tenantName: 'Shop',
          token: expect.any(String),
        }),
      }),
    );
  });

  it('lança TEAM_INVITATION_ALREADY_PENDING', async () => {
    invitationRepository.findPendingByTenantAndEmail.mockResolvedValue({
      id: 'inv-pending',
    });

    await expect(
      useCase.run({
        tenantId: 'tenant-1',
        email: 'a@b.com',
        role: TenantUserRole.BARBER,
        createdByUserId: 'owner-1',
      }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('lança TEAM_MEMBER_ALREADY_EXISTS', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Ana',
    });
    tenantUserRepository.findByTenantAndUser.mockResolvedValue({ id: 'tu-1' });

    await expect(
      useCase.run({
        tenantId: 'tenant-1',
        email: 'a@b.com',
        role: TenantUserRole.BARBER,
        createdByUserId: 'owner-1',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'TEAM_MEMBER_ALREADY_EXISTS' }),
    });
  });
});
