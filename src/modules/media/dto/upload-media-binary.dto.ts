import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MediaType } from '../enums/media-type.enum';

/** Multipart fields (besides `file`). storagePath is NEVER accepted from client. */
export class UploadMediaBinaryDto {
  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  mediaType: MediaType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  tenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'User id dono do professional profile (avatar/gallery)',
  })
  @IsOptional()
  @IsUUID('4')
  professionalId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  serviceId?: string;
}
