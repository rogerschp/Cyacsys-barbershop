import { MediaType } from '../../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from '../storage-path-context';
import { requireUuid } from '../require-uuid';

export class ServiceImageStoragePathStrategy implements IStoragePathStrategy {
  readonly mediaType = MediaType.SERVICE_IMAGE;

  build(context: StoragePathContext): string {
    const serviceId = requireUuid(context.serviceId, 'serviceId');
    requireUuid(context.tenantId, 'tenantId');
    return `services/${serviceId}/cover`;
  }
}
