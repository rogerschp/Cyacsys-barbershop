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
  async upload(input: StorageUploadInput): Promise<UploadedMedia> {
    void input;
    throw new Error(
      'AwsS3Provider is not implemented yet. Use STORAGE_PROVIDER=cloudinary.',
    );
  }

  async delete(providerResourceId: string): Promise<void> {
    void providerResourceId;
    throw new Error(
      'AwsS3Provider is not implemented yet. Use STORAGE_PROVIDER=cloudinary.',
    );
  }

  getPublicUrl(providerResourceId: string, storagePath?: string): string {
    void providerResourceId;
    void storagePath;
    throw new Error(
      'AwsS3Provider is not implemented yet. Use STORAGE_PROVIDER=cloudinary.',
    );
  }
}
