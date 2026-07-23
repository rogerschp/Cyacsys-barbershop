import { TenantResponseDto } from '../dto/tenant-response.dto';
import { TenantEntity } from '../entities/tenant.entity';

export class TenantMapper {
  static toResponse(tenant: TenantEntity): TenantResponseDto {
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      telephone: tenant.telephone,
      cnpj: tenant.cnpj,
      socialMedia: tenant.socialMedia,
      address: tenant.address
        ? {
            street: tenant.address.street,
            number: tenant.address.number,
            city: tenant.address.city,
            state: tenant.address.state,
            zipCode: tenant.address.zipCode,
            country: tenant.address.country,
          }
        : null,
      timezone: tenant.timezone,
      segment: tenant.segment,
      logoMediaId: tenant.logoMediaId ?? null,
      avatarUrl: tenant.logoMedia?.url ?? null,
      latitude: tenant.latitude != null ? Number(tenant.latitude) : null,
      longitude: tenant.longitude != null ? Number(tenant.longitude) : null,
      clientCanCancelConfirmed: tenant.clientCanCancelConfirmed,
      clientCancelConfirmedMinLeadMinutes:
        tenant.clientCancelConfirmedMinLeadMinutes,
    };
  }
}
