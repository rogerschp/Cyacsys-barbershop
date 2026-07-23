import { ApiProperty } from '@nestjs/swagger';
import { MediaAccessLevel } from '../enums/media-access-level.enum';
import { MediaStatus } from '../enums/media-status.enum';
import { MediaType } from '../enums/media-type.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';
import { StorageProviderType } from '../enums/storage-provider-type.enum';

export class MediaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: StorageProviderType })
  provider: StorageProviderType;

  @ApiProperty()
  providerResourceId: string;

  @ApiProperty({ nullable: true })
  providerAssetId: string | null;

  @ApiProperty()
  storagePath: string;

  @ApiProperty({ description: 'Cached public URL' })
  url: string;

  @ApiProperty({ nullable: true })
  checksum: string | null;

  @ApiProperty({ nullable: true })
  originalFileName: string | null;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  extension: string;

  @ApiProperty()
  size: number;

  @ApiProperty({ nullable: true })
  width: number | null;

  @ApiProperty({ nullable: true })
  height: number | null;

  @ApiProperty({ enum: MediaType })
  mediaType: MediaType;

  @ApiProperty({ enum: MediaVisibility })
  visibility: MediaVisibility;

  @ApiProperty({ enum: MediaAccessLevel })
  accessLevel: MediaAccessLevel;

  @ApiProperty({ enum: MediaStatus })
  status: MediaStatus;

  @ApiProperty({ nullable: true })
  failureReason: string | null;

  @ApiProperty({ nullable: true })
  tenantId: string | null;

  @ApiProperty({ nullable: true })
  createdByUserId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
