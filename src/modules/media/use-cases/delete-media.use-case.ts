import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
export class DeleteMediaUseCase {
  private readonly logger = new Logger(DeleteMediaUseCase.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async run(id: string): Promise<MediaResponseDto> {
    const entity = await this.mediaRepository.findById(id);
    if (!entity) {
      throw new NotFoundException('Media not found');
    }

    if (entity.providerResourceId) {
      await this.storage.delete(entity.providerResourceId);
    }

    await this.mediaRepository.update(id, {
      status: MediaStatus.DELETED,
    });
    await this.mediaRepository.softDelete(id);

    this.logger.log({
      event: 'media_deleted',
      mediaId: id,
      timestamp: new Date().toISOString(),
    });

    return MediaMapper.toResponse({
      ...entity,
      status: MediaStatus.DELETED,
    });
  }
}
