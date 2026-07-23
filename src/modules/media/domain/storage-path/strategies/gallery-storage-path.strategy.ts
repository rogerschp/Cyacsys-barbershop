import { MediaType } from '../../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from '../storage-path-context';
import { requireUuid } from '../require-uuid';

export class GalleryStoragePathStrategy implements IStoragePathStrategy {
  readonly mediaType = MediaType.GALLERY;

  build(context: StoragePathContext): string {
    const professionalId = requireUuid(
      context.professionalId,
      'professionalId',
    );
    return `professionals/${professionalId}/gallery`;
  }
}
