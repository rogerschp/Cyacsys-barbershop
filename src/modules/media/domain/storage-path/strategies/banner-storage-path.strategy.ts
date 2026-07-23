import { MediaType } from '../../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from '../storage-path-context';
import { requireUuid } from '../require-uuid';

export class BannerStoragePathStrategy implements IStoragePathStrategy {
  readonly mediaType = MediaType.BANNER;

  build(context: StoragePathContext): string {
    const tenantId = requireUuid(context.tenantId, 'tenantId');
    return `tenants/${tenantId}/banner`;
  }
}
