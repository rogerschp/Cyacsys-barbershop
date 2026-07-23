import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkMediaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  mediaId: string;
}
