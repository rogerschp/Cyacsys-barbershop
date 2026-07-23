import { MediaType } from '../../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from '../storage-path-context';
import { requireUuid } from '../require-uuid';

export class CoverStoragePathStrategy implements IStoragePathStrategy {
  readonly mediaType = MediaType.COVER;

  build(context: StoragePathContext): string {
    const tenantId = requireUuid(context.tenantId, 'tenantId');
    return `tenants/${tenantId}/cover`;
  }
}
