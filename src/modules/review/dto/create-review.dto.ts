import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    required: false,
    maxLength: 1000,
    example: 'Ótimo atendimento!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
