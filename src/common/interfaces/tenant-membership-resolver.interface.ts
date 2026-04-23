export interface TenantMembershipInfo {
    role: string;
}
export interface ITenantMembershipResolver {
    validateMembership(userId: string, tenantId: string): Promise<TenantMembershipInfo>;
}
export const TENANT_MEMBERSHIP_RESOLVER = Symbol('TENANT_MEMBERSHIP_RESOLVER');
