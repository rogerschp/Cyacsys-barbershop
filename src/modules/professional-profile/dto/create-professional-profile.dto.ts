import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { BookingMode } from '../entities/booking-mode.enum';
import { ProfessionalType } from '../entities/professional-type.enum';

const MAX_DISPLAY_NAME = 255;
const MAX_BIO = 2000;

export class CreateProfessionalProfileDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome de exibição (obrigatório, máx. 255 caracteres)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_DISPLAY_NAME)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL do avatar (obrigatório, deve ser URL válida)',
  })
  @IsUrl()
  @IsNotEmpty()
  avatarUrl: string;

  @ApiProperty({ enum: ProfessionalType, example: ProfessionalType.BARBER })
  @IsEnum(ProfessionalType)
  professionalType: ProfessionalType;

  @ApiProperty({
    enum: BookingMode,
    required: false,
    default: BookingMode.DIRECT_BOOKING,
  })
  @IsOptional()
  @IsEnum(BookingMode)
  bookingMode?: BookingMode;

  @ApiProperty({
    required: false,
    example: '+55 (11) 99999-9999',
    description: 'Opcional; armazenado apenas com dígitos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsappNumber?: string;

  @ApiProperty({
    required: false,
    example: '@joao.profissional',
    description: 'Opcional; armazenado sem @',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  instagramUsername?: string;

  @ApiProperty({
    example: 5,
    description: 'Anos de experiência (>= 0)',
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'experienceYears não pode ser negativo' })
  experienceYears: number;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Especialista em cortes modernos',
    description: 'Bio opcional (máx. 2000 caracteres)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_BIO)
  @Transform(({ value }) =>
    value === '' || value === undefined ? undefined : value?.trim(),
  )
  bio?: string | null;
}
