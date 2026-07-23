import { createHash } from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { MediaPolicy } from '../domain/media-policy';
import { StoragePathFactory } from '../domain/storage-path/storage-path.factory';
import { MediaResponseDto } from '../dto/media-response.dto';
import { UploadMediaBinaryDto } from '../dto/upload-media-binary.dto';
import { MediaStatus } from '../enums/media-status.enum';
import {
  IMediaRepository,
  MEDIA_REPOSITORY,
} from '../interfaces/media-repository.interface';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
} from '../interfaces/storage-provider.interface';
import { MediaMapper } from '../mappers/media.mapper';

export type UploadMediaBinaryFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class UploadMediaBinaryUseCase {
  private readonly logger = new Logger(UploadMediaBinaryUseCase.name);

  constructor(
    private readonly mediaPolicy: MediaPolicy,
    private readonly storagePathFactory: StoragePathFactory,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async run(
    file: UploadMediaBinaryFile | undefined,
    dto: UploadMediaBinaryDto,
    createdByUserId: string,
  ): Promise<MediaResponseDto> {
    if (!file?.buffer?.length) {
      throw new BusinessRuleException(
        'MEDIA_FILE_REQUIRED',
        'Arquivo é obrigatório no campo file.',
      );
    }

    this.mediaPolicy.assertFileAllowed(
      dto.mediaType,
      file.mimetype,
      file.size || file.buffer.length,
    );

    const storagePath = this.storagePathFactory.build({
      mediaType: dto.mediaType,
      tenantId: dto.tenantId,
      professionalId: dto.professionalId,
      serviceId: dto.serviceId,
      createdByUserId,
    });

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const defaults = this.mediaPolicy.resolveDefaults(dto.mediaType);

    let uploaded;
    try {
      uploaded = await this.storage.upload({
        buffer: file.buffer,
        mimeType: file.mimetype,
        storagePath,
        originalName: file.originalname,
      });
    } catch (error) {
      this.logger.error(
        {
          event: 'media_upload_failed',
          mediaType: dto.mediaType,
          storagePath,
          reason: error instanceof Error ? error.message : 'unknown',
        },
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    const entity = await this.mediaRepository.create({
      provider: uploaded.provider,
      providerResourceId: uploaded.providerResourceId,
      providerAssetId: uploaded.providerAssetId ?? null,
      storagePath,
      url: uploaded.url,
      checksum,
      originalFileName: file.originalname || null,
      mimeType: uploaded.mimeType,
      extension: uploaded.extension,
      size: uploaded.size,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      mediaType: dto.mediaType,
      visibility: defaults.visibility,
      accessLevel: defaults.accessLevel,
      status: MediaStatus.AVAILABLE,
      tenantId: dto.tenantId ?? null,
      createdByUserId,
    });

    this.logger.log({
      event: 'media_uploaded',
      mediaId: entity.id,
      mediaType: dto.mediaType,
      storagePath,
      timestamp: new Date().toISOString(),
    });

    return MediaMapper.toResponse(entity);
  }
}
