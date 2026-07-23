import { Inject, Injectable, Logger } from '@nestjs/common';
import { MediaPolicy } from '../domain/media-policy';
import { StoragePathFactory } from '../domain/storage-path/storage-path.factory';
import { CreateMediaDto } from '../dto/create-media.dto';
import { MediaResponseDto } from '../dto/media-response.dto';
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

@Injectable()
export class CreateMediaUseCase {
  private readonly logger = new Logger(CreateMediaUseCase.name);

  constructor(
    private readonly mediaPolicy: MediaPolicy,
    private readonly storagePathFactory: StoragePathFactory,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async run(
    dto: CreateMediaDto,
    createdByUserId: string,
  ): Promise<MediaResponseDto> {
    const defaults = this.mediaPolicy.resolveDefaults(dto.mediaType);
    const storagePath = this.storagePathFactory.build({
      mediaType: dto.mediaType,
      tenantId: dto.tenantId,
      professionalId: dto.professionalId,
      serviceId: dto.serviceId,
      createdByUserId,
    });

    const url =
      dto.url?.trim() ||
      this.storage.getPublicUrl(dto.providerResourceId, storagePath);

    const entity = await this.mediaRepository.create({
      provider: dto.provider,
      providerResourceId: dto.providerResourceId,
      providerAssetId: dto.providerAssetId ?? null,
      storagePath,
      url,
      checksum: dto.checksum ?? null,
      originalFileName: dto.originalFileName ?? null,
      mimeType: dto.mimeType,
      extension: dto.extension,
      size: dto.size,
      width: dto.width ?? null,
      height: dto.height ?? null,
      mediaType: dto.mediaType,
      visibility: dto.visibility ?? defaults.visibility,
      accessLevel: dto.accessLevel ?? defaults.accessLevel,
      status: MediaStatus.AVAILABLE,
      tenantId: dto.tenantId ?? null,
      createdByUserId,
    });

    this.logger.log({
      event: 'media_registered',
      mediaId: entity.id,
      mediaType: dto.mediaType,
      timestamp: new Date().toISOString(),
    });

    return MediaMapper.toResponse(entity);
  }
}
