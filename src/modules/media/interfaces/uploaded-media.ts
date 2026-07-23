import { StorageProviderType } from '../enums/storage-provider-type.enum';

/** Provider-agnostic upload result. Use cases must not depend on Cloudinary/S3 types. */
export interface UploadedMedia {
  providerResourceId: string;
  providerAssetId?: string | null;
  url: string;
  provider: StorageProviderType;
  mimeType: string;
  extension: string;
  size: number;
  width?: number | null;
  height?: number | null;
}
