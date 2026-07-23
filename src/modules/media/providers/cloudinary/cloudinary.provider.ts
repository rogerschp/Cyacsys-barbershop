import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { BusinessRuleException } from '../../../../common/exceptions/business-rule.exception';
import { StorageProviderType } from '../../enums/storage-provider-type.enum';
import {
  IStorageProvider,
  StorageUploadInput,
} from '../../interfaces/storage-provider.interface';
import { UploadedMedia } from '../../interfaces/uploaded-media';

@Injectable()
export class CloudinaryProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryProvider.name);
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    this.configured = Boolean(cloudName && apiKey && apiSecret);
    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  private assertConfigured(): void {
    if (!this.configured) {
      throw new BusinessRuleException(
        'MEDIA_STORAGE_MISCONFIGURED',
        'Cloudinary não configurado (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).',
      );
    }
  }

  async upload(input: StorageUploadInput): Promise<UploadedMedia> {
    this.assertConfigured();
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: input.storagePath,
            resource_type: 'auto',
            use_filename: Boolean(input.originalName),
            unique_filename: true,
            overwrite: false,
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error ?? new Error('Cloudinary upload returned empty'));
              return;
            }
            resolve(uploadResult);
          },
        );
        stream.end(input.buffer);
      });

      const extension =
        result.format ||
        this.extensionFromMime(input.mimeType) ||
        this.extensionFromName(input.originalName) ||
        'bin';

      return {
        providerResourceId: result.public_id,
        providerAssetId: result.asset_id ?? null,
        url: result.secure_url || result.url,
        provider: StorageProviderType.CLOUDINARY,
        mimeType: input.mimeType,
        extension,
        size: result.bytes ?? input.buffer.length,
        width: result.width ?? null,
        height: result.height ?? null,
      };
    } catch (error) {
      this.logger.error('Cloudinary upload failed', error);
      throw new BusinessRuleException(
        'MEDIA_UPLOAD_FAILED',
        error instanceof Error
          ? error.message
          : 'Falha ao enviar arquivo para o storage.',
      );
    }
  }

  async delete(providerResourceId: string): Promise<void> {
    this.assertConfigured();
    try {
      await cloudinary.uploader.destroy(providerResourceId, {
        resource_type: 'image',
      });
    } catch (error) {
      this.logger.warn(
        `Cloudinary destroy failed for ${providerResourceId}, retrying as raw`,
      );
      try {
        await cloudinary.uploader.destroy(providerResourceId, {
          resource_type: 'raw',
        });
      } catch (second) {
        this.logger.error('Cloudinary delete failed', second);
        throw new BusinessRuleException(
          'MEDIA_DELETE_FAILED',
          'Falha ao remover arquivo do storage.',
        );
      }
    }
  }

  getPublicUrl(providerResourceId: string): string {
    this.assertConfigured();
    return cloudinary.url(providerResourceId, { secure: true });
  }

  private extensionFromMime(mimeType: string): string | null {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };
    return map[mimeType] ?? null;
  }

  private extensionFromName(name?: string): string | null {
    if (!name || !name.includes('.')) return null;
    return name.split('.').pop()?.toLowerCase() || null;
  }
}
