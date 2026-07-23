import { UploadedMedia } from './uploaded-media';

export interface StorageUploadInput {
  buffer: Buffer;
  mimeType: string;
  storagePath: string;
  originalName?: string;
}

export interface IStorageProvider {
  upload(input: StorageUploadInput): Promise<UploadedMedia>;
  delete(providerResourceId: string): Promise<void>;
  getPublicUrl(providerResourceId: string, storagePath?: string): string;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
