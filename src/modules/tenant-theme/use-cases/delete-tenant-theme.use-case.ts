import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../tenant/interfaces/tenant-repository.interface';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';

@Injectable()
export class DeleteTenantThemeUseCase {
  private readonly logger = new Logger(DeleteTenantThemeUseCase.name);

  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(tenantId: string, performedBy: string): Promise<void> {
    await this.findTenantByIdUseCase.run(tenantId);
    await this.tenantRepository.updateTheme(tenantId, null);

    this.logger.log({
      event: 'tenant_theme_deleted',
      tenantId,
      performedBy,
      timestamp: new Date().toISOString(),
    });
  }
}
