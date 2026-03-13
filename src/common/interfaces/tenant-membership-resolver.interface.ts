/**
 * Contrato para validar vínculo usuário–tenant e obter a role.
 * A implementação (ex.: tenant-user) usa o repositório/serviço de domínio.
 * Permite que o TenantMembershipGuard fique em common sem depender de um módulo específico.
 */
export interface TenantMembershipInfo {
  role: string;
}

export interface ITenantMembershipResolver {
  /**
   * Valida que o usuário é membro ativo do tenant e retorna a role.
   * Lança ForbiddenException (ou compatível) se não for membro ou inativo.
   */
  validateMembership(
    userId: string,
    tenantId: string,
  ): Promise<TenantMembershipInfo>;
}

export const TENANT_MEMBERSHIP_RESOLVER = Symbol('TENANT_MEMBERSHIP_RESOLVER');
