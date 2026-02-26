import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateSlugDto {
  @ApiProperty({
    example: 'barbearia-do-vitinho',
    description: 'Slug a validar (será normalizado no servidor)',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
