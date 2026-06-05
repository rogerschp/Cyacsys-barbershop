import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class BaseSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Busca por nome ou slug (mínimo 2 caracteres)',
    example: 'barbearia',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Latitude para busca por região',
    example: -23.5505199,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude para busca por região',
    example: -46.6333094,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({
    description: 'Raio de busca em km (padrão 10, máximo 50)',
    example: 10,
    default: 10,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(50)
  radius?: number;

  @ApiPropertyOptional({
    description: 'Página (padrão 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Itens por página (padrão 20, máximo 50)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}
