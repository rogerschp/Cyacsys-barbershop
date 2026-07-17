import { Inject, Injectable } from '@nestjs/common';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { TenantStatus } from '../../tenant/entities/tenant-status.enum';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { PublicTenantProfessionalResponseDto } from '../dto/public-tenant-professional-response.dto';
import {
  ITenantProfessionalRepository,
  TENANT_PROFESSIONAL_REPOSITORY,
} from '../interfaces/tenant-professional-repository.interface';
import { mapToPublicTenantProfessional } from '../mappers/public-tenant-professional.mapper';

@Injectable()
export class ListPublicTenantProfessionalsUseCase {
  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(tenantId: string): Promise<PublicTenantProfessionalResponseDto[]> {
    const tenant = await this.findTenantByIdUseCase.run(tenantId);
    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new TenantForbiddenException(
        'TENANT_NOT_ACTIVE',
        'Estabelecimento não está ativo.',
        { tenantId },
      );
    }

    const rows = await this.tenantProfessionalRepository.listByTenant(
      tenantId,
      { activeOnly: true },
    );
    return rows.map(mapToPublicTenantProfessional);
  }
}
