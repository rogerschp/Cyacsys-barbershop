import { MediaType } from '../../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from '../storage-path-context';
import { requireUuid } from '../require-uuid';

export class DocumentStoragePathStrategy implements IStoragePathStrategy {
  readonly mediaType = MediaType.DOCUMENT;

  build(context: StoragePathContext): string {
    const tenantId = requireUuid(context.tenantId, 'tenantId');
    return `tenants/${tenantId}/documents`;
  }
}
