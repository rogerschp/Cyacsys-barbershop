/**
 * User lifecycle status.
 * - ACTIVE: usuário ativo (pode acessar o sistema).
 * - INACTIVE: usuário desativado.
 * - SUSPENDED: bloqueio temporário ou manual.
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
