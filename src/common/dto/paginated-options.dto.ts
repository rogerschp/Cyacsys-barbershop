import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginatedOptionsDto {
  @ApiPropertyOptional({
    description:
      'First record index (0-based). Used by PrimeReact Table for pagination.',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  first?: number = 0;

  @ApiPropertyOptional({
    description:
      'Number of records per page. Used by PrimeReact Table for pagination.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rows?: number = 10;

  @ApiPropertyOptional({
    description: 'Field name to sort by. Must be a valid User entity field.',
    example: 'name',
    enum: ['id', 'email', 'name', 'role', 'active', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'email', 'name', 'role', 'active', 'createdAt', 'updatedAt'])
  sortField?: string;

  @ApiPropertyOptional({
    description:
      'Sort order: 1 for ascending, -1 for descending. Used by PrimeReact Table.',
    example: 1,
    enum: [1, -1],
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, -1])
  sortOrder?: number = 1;
}
