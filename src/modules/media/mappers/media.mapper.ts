import { MediaEntity } from '../entities/media.entity';
import { MediaResponseDto } from '../dto/media-response.dto';

export class MediaMapper {
  static toResponse(entity: MediaEntity): MediaResponseDto {
    return {
      id: entity.id,
      provider: entity.provider,
      providerResourceId: entity.providerResourceId,
      providerAssetId: entity.providerAssetId,
      storagePath: entity.storagePath,
      url: entity.url,
      checksum: entity.checksum,
      originalFileName: entity.originalFileName,
      mimeType: entity.mimeType,
      extension: entity.extension,
      size: entity.size,
      width: entity.width,
      height: entity.height,
      mediaType: entity.mediaType,
      visibility: entity.visibility,
      accessLevel: entity.accessLevel,
      status: entity.status,
      failureReason: entity.failureReason,
      tenantId: entity.tenantId,
      createdByUserId: entity.createdByUserId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
