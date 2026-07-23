import { MediaType } from '../../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from '../storage-path-context';
import { requireUuid } from '../require-uuid';

export class OtherStoragePathStrategy implements IStoragePathStrategy {
  readonly mediaType = MediaType.OTHER;

  build(context: StoragePathContext): string {
    if (context.tenantId) {
      const tenantId = requireUuid(context.tenantId, 'tenantId');
      return `tenants/${tenantId}/other`;
    }
    const userId = requireUuid(context.createdByUserId, 'createdByUserId');
    return `users/${userId}/other`;
  }
}
