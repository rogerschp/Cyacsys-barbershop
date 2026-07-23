import { MediaType } from '../../../enums/media-type.enum';
import {
  IStoragePathStrategy,
  StoragePathContext,
} from '../storage-path-context';
import { requireUuid } from '../require-uuid';

/** Client (user) avatar — path uses authenticated user id from context. */
export class UserAvatarStoragePathStrategy implements IStoragePathStrategy {
  readonly mediaType = MediaType.USER_AVATAR;

  build(context: StoragePathContext): string {
    const userId = requireUuid(context.createdByUserId, 'createdByUserId');
    return `users/${userId}/avatar`;
  }
}
