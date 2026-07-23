import { Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  StorageUploadInput,
} from '../../interfaces/storage-provider.interface';
import { UploadedMedia } from '../../interfaces/uploaded-media';

/**
 * Placeholder for future AWS S3 implementation.
 * Register via STORAGE_PROVIDER=aws once implemented.
 */
@Injectable()
export class AwsS3Provider implements IStorageProvider {
  async upload(_input: StorageUploadInput): Promise<UploadedMedia> {
    throw new Error(
      'AwsS3Provider is not implemented yet. Use STORAGE_PROVIDER=cloudinary.',
    );
  }

  async delete(_providerResourceId: string): Promise<void> {
    throw new Error(
      'AwsS3Provider is not implemented yet. Use STORAGE_PROVIDER=cloudinary.',
    );
  }

  getPublicUrl(_providerResourceId: string, _storagePath?: string): string {
    throw new Error(
      'AwsS3Provider is not implemented yet. Use STORAGE_PROVIDER=cloudinary.',
    );
  }
}
