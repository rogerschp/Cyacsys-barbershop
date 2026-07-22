import { Test, TestingModule } from '@nestjs/testing';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from 'src/modules/tenant-user/entities/tenant-user-status.enum';
import { TENANT_USER_REPOSITORY } from 'src/modules/tenant-user/interfaces/tenant-user-repository.interface';
import { ListMyTenantsUseCase } from 'src/modules/tenant-user/use-cases/list-my-tenants.use-case';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';

describe('ListMyTenantsUseCase', () => {
  let useCase: ListMyTenantsUseCase;
  const listActiveByUserId = jest.fn();

  beforeEach(async () => {
    listActiveByUserId.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListMyTenantsUseCase,
        {
          provide: TENANT_USER_REPOSITORY,
          useValue: { listActiveByUserId },
        },
      ],
    }).compile();
    useCase = module.get(ListMyTenantsUseCase);
  });

  it('retorna [] quando não há memberships', async () => {
    listActiveByUserId.mockResolvedValue([]);
    await expect(useCase.run('user-1')).resolves.toEqual([]);
    expect(listActiveByUserId).toHaveBeenCalledWith('user-1');
  });

  it('mapeia memberships ACTIVE com resumo do tenant', async () => {
    listActiveByUserId.mockResolvedValue([
      {
        id: 'tu-1',
        role: TenantUserRole.OWNER,
        status: TenantUserStatus.ACTIVE,
        tenant: {
          id: 'tenant-1',
          slug: 'barbearia-do-vitinho',
          name: 'Barbearia do Vitinho',
          status: TenantStatus.ACTIVE,
          telephone: '5511999999999',
          timezone: 'America/Sao_Paulo',
          segment: TenantSegment.BARBERSHOP,
          avatarUrl: 'https://cdn.example/a.png',
          clientCanCancelConfirmed: false,
          clientCancelConfirmedMinLeadMinutes: 60,
        },
      },
    ]);

    await expect(useCase.run('user-1')).resolves.toEqual([
      {
        membershipId: 'tu-1',
        role: TenantUserRole.OWNER,
        status: TenantUserStatus.ACTIVE,
        tenant: {
          id: 'tenant-1',
          slug: 'barbearia-do-vitinho',
          name: 'Barbearia do Vitinho',
          status: TenantStatus.ACTIVE,
          telephone: '5511999999999',
          timezone: 'America/Sao_Paulo',
          segment: TenantSegment.BARBERSHOP,
          avatarUrl: 'https://cdn.example/a.png',
          clientCanCancelConfirmed: false,
          clientCancelConfirmedMinLeadMinutes: 60,
        },
      },
    ]);
  });
});
