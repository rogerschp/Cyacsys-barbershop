import { Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { MediaAccessLevel } from '../enums/media-access-level.enum';
import { MediaType } from '../enums/media-type.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const DOCUMENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type MediaLimits = {
  maxBytes: number;
  allowedMimes: readonly string[];
};

export type MediaClassificationDefaults = {
  visibility: MediaVisibility;
  accessLevel: MediaAccessLevel;
};

/**
 * Central limits / allowlists. Swap values (e.g. Elite plan) without changing use cases.
 */
@Injectable()
export class MediaPolicy {
  readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  readonly MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
  readonly ALLOWED_IMAGE_TYPES = IMAGE_MIMES;
  readonly ALLOWED_DOCUMENT_TYPES = DOCUMENT_MIMES;

  resolveLimits(mediaType: MediaType): MediaLimits {
    if (mediaType === MediaType.DOCUMENT) {
      return {
        maxBytes: this.MAX_DOCUMENT_SIZE,
        allowedMimes: this.ALLOWED_DOCUMENT_TYPES,
      };
    }
    if (mediaType === MediaType.OTHER) {
      return {
        maxBytes: this.MAX_DOCUMENT_SIZE,
        allowedMimes: [
          ...new Set([
            ...this.ALLOWED_IMAGE_TYPES,
            ...this.ALLOWED_DOCUMENT_TYPES,
          ]),
        ],
      };
    }
    return {
      maxBytes: this.MAX_IMAGE_SIZE,
      allowedMimes: this.ALLOWED_IMAGE_TYPES,
    };
  }

  resolveDefaults(mediaType: MediaType): MediaClassificationDefaults {
    if (mediaType === MediaType.DOCUMENT) {
      return {
        visibility: MediaVisibility.PRIVATE,
        accessLevel: MediaAccessLevel.OWNER_ONLY,
      };
    }
    if (mediaType === MediaType.OTHER) {
      return {
        visibility: MediaVisibility.TENANT_ONLY,
        accessLevel: MediaAccessLevel.TENANT_MEMBER,
      };
    }
    return {
      visibility: MediaVisibility.PUBLIC,
      accessLevel: MediaAccessLevel.PUBLIC,
    };
  }

  assertFileAllowed(
    mediaType: MediaType,
    mimeType: string,
    sizeBytes: number,
  ): void {
    const { maxBytes, allowedMimes } = this.resolveLimits(mediaType);
    if (!mimeType || !allowedMimes.includes(mimeType)) {
      throw new BusinessRuleException(
        'MEDIA_INVALID_MIME',
        `Tipo de arquivo não permitido para ${mediaType}: ${mimeType || '(vazio)'}`,
        { mediaType, mimeType },
      );
    }
    if (sizeBytes <= 0) {
      throw new BusinessRuleException(
        'MEDIA_EMPTY_FILE',
        'Arquivo vazio não é permitido.',
      );
    }
    if (sizeBytes > maxBytes) {
      throw new BusinessRuleException(
        'MEDIA_FILE_TOO_LARGE',
        `Arquivo excede o limite de ${maxBytes} bytes para ${mediaType}.`,
        { mediaType, sizeBytes, maxBytes },
      );
    }
  }
}
