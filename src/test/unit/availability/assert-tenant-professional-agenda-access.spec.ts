import { NotFoundException } from '@nestjs/common';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';
import { assertTenantProfessionalAgendaAccess } from 'src/modules/availability/utils/assert-tenant-professional-agenda-access';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('assertTenantProfessionalAgendaAccess', () => {
  const tenantId = 'tenant-uuid';
  const tenantProfessionalId = 'tp-uuid';
  const userId = 'user-uuid';

  it('lança NotFoundException quando vínculo não existe (OWNER)', async () => {
    await expect(
      assertTenantProfessionalAgendaAccess({
        tenantId,
        tenantProfessionalId: 'invalid-id',
        userId,
        callerRole: TenantUserRole.OWNER,
        tenantProfessionalRepository: {
          findById: jest.fn().mockResolvedValue(null),
        } as any,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('permite OWNER gerenciar vínculo existente no tenant', async () => {
    await expect(
      assertTenantProfessionalAgendaAccess({
        tenantId,
        tenantProfessionalId,
        userId,
        callerRole: TenantUserRole.OWNER,
        tenantProfessionalRepository: {
          findById: jest.fn().mockResolvedValue({
            id: tenantProfessionalId,
            tenantId,
            professionalProfile: { userId: 'other-user' },
          }),
        } as any,
      }),
    ).resolves.toBeUndefined();
  });

  it('BARBER só pode gerenciar a própria agenda', async () => {
    await expect(
      assertTenantProfessionalAgendaAccess({
        tenantId,
        tenantProfessionalId,
        userId,
        callerRole: TenantUserRole.BARBER,
        tenantProfessionalRepository: {
          findById: jest.fn().mockResolvedValue({
            id: tenantProfessionalId,
            tenantId,
            professionalProfile: { userId: 'other-user' },
          }),
        } as any,
      }),
    ).rejects.toThrow(TenantForbiddenException);
  });
});
