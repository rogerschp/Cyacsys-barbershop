/**
 * Tenant lifecycle status.
 * - ACTIVE: normal operation (agenda, serviços, financeiro).
 * - INACTIVE: tenant desativado (ex.: dono desativou).
 * - SUSPENDED: bloqueio por inadimplência ou manual.
 */
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
