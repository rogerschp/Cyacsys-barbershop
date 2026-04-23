import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantForbiddenException } from '../../../../common/exceptions/tenant-forbidden.exception';
import {
  RequestWithTenantRole,
  TenantRolesGuard,
} from '../../../../common/guards/tenant-roles.guard';
import { TenantUserRole } from '../../../../modules/tenant-user/entities/tenant-user-role.enum';
describe('TenantRolesGuard', () => {
  let guard: TenantRolesGuard;
  let reflector: Reflector;
  const createMockContext = (
    overrides: Partial<RequestWithTenantRole> = {},
  ): ExecutionContext => {
    const request: RequestWithTenantRole = {
      user: { dbUser: { id: 'user-uuid' } },
      tenant: { id: 'tenant-uuid' },
      tenantMembership: { role: TenantUserRole.ADMIN },
      url: '/tenants/tenant-uuid/members',
      path: '/tenants/tenant-uuid/members',
      method: 'POST',
      ...overrides,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };
  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantRolesGuard(reflector);
  });
  it('deve permitir quando não há roles requeridas (metadata vazia)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
  it('deve permitir quando a role do membership está nas requeridas', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([TenantUserRole.OWNER, TenantUserRole.ADMIN]);
    const ctx = createMockContext();
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
  it('deve permitir quando OWNER satisfaz role BARBER por hierarquia', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([TenantUserRole.BARBER]);
    const ctx = createMockContext({
      tenantMembership: { role: TenantUserRole.OWNER },
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
  it('deve negar e lançar TenantForbiddenException (INSUFFICIENT_ROLE) quando role não está nas requeridas', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([TenantUserRole.OWNER]);
    const ctx = createMockContext({
      tenantMembership: { role: TenantUserRole.STAFF },
    });
    let thrown: any;
    try {
      await guard.canActivate(ctx);
    } catch (e: any) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(TenantForbiddenException);
    expect(thrown.getResponse()).toMatchObject({
      statusCode: 403,
      error: 'FORBIDDEN',
      code: 'INSUFFICIENT_ROLE',
      tenantId: 'tenant-uuid',
      path: expect.any(String),
    });
    expect(thrown.getResponse().message).toContain('STAFF');
  });
  it('deve negar e lançar TenantForbiddenException (NO_MEMBERSHIP) quando não há tenantMembership', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([TenantUserRole.OWNER]);
    const ctx = createMockContext({ tenantMembership: undefined });
    let thrown: any;
    try {
      await guard.canActivate(ctx);
    } catch (e: any) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(TenantForbiddenException);
    expect(thrown.getResponse()).toMatchObject({
      statusCode: 403,
      error: 'FORBIDDEN',
      code: 'NO_MEMBERSHIP',
      tenantId: 'tenant-uuid',
    });
  });
});
