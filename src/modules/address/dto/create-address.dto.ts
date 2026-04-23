import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Rua 26 de março' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: '882' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  number: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state: string;

  @ApiProperty({ example: '04001-000' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'zipCode deve estar no formato 00000-000',
  })
  zipCode: string;

  @ApiProperty({ example: 'Brazil' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: 'Apto 42', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;
}
