import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MediaAccessLevel } from '../enums/media-access-level.enum';
import { MediaType } from '../enums/media-type.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';
import { StorageProviderType } from '../enums/storage-provider-type.enum';

/** Register media already present in the storage provider (no binary). */
export class CreateMediaDto {
  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  mediaType: MediaType;

  @ApiProperty({ enum: StorageProviderType })
  @IsEnum(StorageProviderType)
  provider: StorageProviderType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  providerResourceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  providerAssetId?: string | null;

  @ApiPropertyOptional({
    description: 'Cached URL; if omitted, regenerated via provider',
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  mimeType: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  extension: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  size: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  checksum?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  originalFileName?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  professionalId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  serviceId?: string;

  @ApiPropertyOptional({ enum: MediaVisibility })
  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: MediaVisibility;

  @ApiPropertyOptional({ enum: MediaAccessLevel })
  @IsOptional()
  @IsEnum(MediaAccessLevel)
  accessLevel?: MediaAccessLevel;
}
