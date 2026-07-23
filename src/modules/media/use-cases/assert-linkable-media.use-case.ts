import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { MediaEntity } from '../entities/media.entity';
import { MediaStatus } from '../enums/media-status.enum';
import { MediaType } from '../enums/media-type.enum';
import {
  IMediaRepository,
  MEDIA_REPOSITORY,
} from '../interfaces/media-repository.interface';

export type AssertLinkableMediaByUserInput = {
  mediaId: string;
  currentUserId: string;
  expectedType: MediaType.USER_AVATAR | MediaType.AVATAR;
};

export type AssertLinkableMediaByTenantInput = {
  mediaId: string;
  tenantId: string;
  expectedType: MediaType.LOGO;
};

@Injectable()
export class AssertLinkableMediaUseCase {
  constructor(
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async assertOwnedByUser(
    input: AssertLinkableMediaByUserInput,
  ): Promise<MediaEntity> {
    const media = await this.requireAvailableMedia(
      input.mediaId,
      input.expectedType,
    );
    if (media.createdByUserId !== input.currentUserId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'FORBIDDEN',
        code: 'MEDIA_NOT_OWNED',
        message: 'Media does not belong to current user.',
      });
    }
    return media;
  }

  async assertOwnedByTenant(
    input: AssertLinkableMediaByTenantInput,
  ): Promise<MediaEntity> {
    const media = await this.requireAvailableMedia(
      input.mediaId,
      input.expectedType,
    );
    if (media.tenantId !== input.tenantId) {
      throw new TenantForbiddenException(
        'MEDIA_NOT_OWNED',
        'Media does not belong to this tenant.',
        { tenantId: input.tenantId },
      );
    }
    return media;
  }

  private async requireAvailableMedia(
    mediaId: string,
    expectedType: MediaType,
  ): Promise<MediaEntity> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    if (media.status !== MediaStatus.AVAILABLE) {
      throw new BusinessRuleException(
        'MEDIA_NOT_AVAILABLE',
        'Media must be AVAILABLE to link.',
        { mediaId, status: media.status },
      );
    }
    if (media.mediaType !== expectedType) {
      throw new BusinessRuleException(
        'MEDIA_TYPE_MISMATCH',
        `Expected mediaType ${expectedType}, got ${media.mediaType}.`,
        { mediaId, expectedType, actualType: media.mediaType },
      );
    }
    return media;
  }
}
