import { MediaAccessLevel } from '../enums/media-access-level.enum';
import { MediaStatus } from '../enums/media-status.enum';
import { MediaType } from '../enums/media-type.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';
import { StorageProviderType } from '../enums/storage-provider-type.enum';
import { MediaEntity } from '../entities/media.entity';

export interface CreateMediaData {
  provider: StorageProviderType;
  providerResourceId: string;
  providerAssetId?: string | null;
  storagePath: string;
  url: string;
  checksum?: string | null;
  originalFileName?: string | null;
  mimeType: string;
  extension: string;
  size: number;
  width?: number | null;
  height?: number | null;
  mediaType: MediaType;
  visibility: MediaVisibility;
  accessLevel: MediaAccessLevel;
  status: MediaStatus;
  failureReason?: string | null;
  tenantId?: string | null;
  createdByUserId?: string | null;
}

export interface UpdateMediaData {
  providerResourceId?: string;
  providerAssetId?: string | null;
  url?: string;
  checksum?: string | null;
  width?: number | null;
  height?: number | null;
  status?: MediaStatus;
  failureReason?: string | null;
}

export interface IMediaRepository {
  create(data: CreateMediaData): Promise<MediaEntity>;
  update(id: string, data: UpdateMediaData): Promise<MediaEntity>;
  findById(id: string): Promise<MediaEntity | null>;
  /** Prepared for future dedupe; not used by UploadMediaBinary MVP. */
  findByChecksum(checksum: string): Promise<MediaEntity | null>;
  softDelete(id: string): Promise<void>;
}

export const MEDIA_REPOSITORY = Symbol('MEDIA_REPOSITORY');
