import { MediaType } from '../../enums/media-type.enum';

export type StoragePathContext = {
  mediaType: MediaType;
  tenantId?: string | null;
  professionalId?: string | null;
  serviceId?: string | null;
  createdByUserId?: string | null;
};

export interface IStoragePathStrategy {
  readonly mediaType: MediaType;
  build(context: StoragePathContext): string;
}
