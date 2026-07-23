import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MediaResponseDto } from '../dto/media-response.dto';
import {
  IMediaRepository,
  MEDIA_REPOSITORY,
} from '../interfaces/media-repository.interface';
import { MediaMapper } from '../mappers/media.mapper';

@Injectable()
export class FindMediaByIdUseCase {
  constructor(
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
  ) {}

  async run(id: string): Promise<MediaResponseDto> {
    const entity = await this.mediaRepository.findById(id);
    if (!entity) {
      throw new NotFoundException('Media not found');
    }
    return MediaMapper.toResponse(entity);
  }
}
