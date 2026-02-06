import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Barbearia do Vitinho' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'barbearia-do-vitinho' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers and hyphens',
  })
  slug: string;
}
