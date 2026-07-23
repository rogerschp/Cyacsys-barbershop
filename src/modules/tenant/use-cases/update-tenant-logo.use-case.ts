import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { MediaType } from '../../media/enums/media-type.enum';
import { AssertLinkableMediaUseCase } from '../../media/use-cases/assert-linkable-media.use-case';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../interfaces/tenant-repository.interface';
import { FindTenantByIdUseCase } from './find-tenant-by-id.use-case';

@Injectable()
export class UpdateTenantLogoUseCase {
  private readonly logger = new Logger(UpdateTenantLogoUseCase.name);

  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    private readonly assertLinkableMedia: AssertLinkableMediaUseCase,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(tenantId: string, mediaId: string): Promise<TenantResponseDto> {
    await this.assertLinkableMedia.assertOwnedByTenant({
      mediaId,
      tenantId,
      expectedType: MediaType.LOGO,
    });

    await this.tenantRepository.update(tenantId, { logoMediaId: mediaId });

    this.logger.log({
      event: 'tenant_logo_linked',
      tenantId,
      mediaId,
      timestamp: new Date().toISOString(),
    });

    return this.findTenantByIdUseCase.run(tenantId);
  }
}
