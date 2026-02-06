import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateSlugDto {
  @ApiProperty({ example: 'barbearia-do-vitinho' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
