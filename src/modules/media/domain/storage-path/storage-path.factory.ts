import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessRuleException } from '../../../../common/exceptions/business-rule.exception';
import { MediaConfig } from '../../../../config/media.config';
import { MediaType } from '../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from './storage-path-context';
import { AvatarStoragePathStrategy } from './strategies/avatar-storage-path.strategy';
import { BannerStoragePathStrategy } from './strategies/banner-storage-path.strategy';
import { CoverStoragePathStrategy } from './strategies/cover-storage-path.strategy';
import { DocumentStoragePathStrategy } from './strategies/document-storage-path.strategy';
import { GalleryStoragePathStrategy } from './strategies/gallery-storage-path.strategy';
import { LogoStoragePathStrategy } from './strategies/logo-storage-path.strategy';
import { OtherStoragePathStrategy } from './strategies/other-storage-path.strategy';
import { ServiceImageStoragePathStrategy } from './strategies/service-image-storage-path.strategy';

/**
 * Builds logical storage paths. Always prefixes with MEDIA_ENV (dev|prod)
 * so one Cloudinary account keeps isolated folder trees.
 */
@Injectable()
export class StoragePathFactory {
  private readonly strategies: Map<MediaType, IStoragePathStrategy>;

  constructor(private readonly config: ConfigService) {
    const list: IStoragePathStrategy[] = [
      new AvatarStoragePathStrategy(),
      new LogoStoragePathStrategy(),
      new BannerStoragePathStrategy(),
      new CoverStoragePathStrategy(),
      new GalleryStoragePathStrategy(),
      new ServiceImageStoragePathStrategy(),
      new DocumentStoragePathStrategy(),
      new OtherStoragePathStrategy(),
    ];
    this.strategies = new Map(list.map((s) => [s.mediaType, s]));
  }

  build(context: StoragePathContext): string {
    const strategy = this.strategies.get(context.mediaType);
    if (!strategy) {
      throw new BusinessRuleException(
        'MEDIA_UNSUPPORTED_TYPE',
        `MediaType sem strategy de storage: ${context.mediaType}`,
      );
    }
    const relative = strategy.build(context);
    const mediaEnv = this.resolveMediaEnv();
    return `${mediaEnv}/${relative}`;
  }

  private resolveMediaEnv(): 'dev' | 'prod' {
    const fromNamespace = this.config.get<MediaConfig>('media')?.env;
    if (fromNamespace === 'dev' || fromNamespace === 'prod') {
      return fromNamespace;
    }
    const raw = (this.config.get<string>('MEDIA_ENV') ?? 'dev')
      .trim()
      .toLowerCase();
    if (raw === 'prod' || raw === 'production') {
      return 'prod';
    }
    return 'dev';
  }
}
