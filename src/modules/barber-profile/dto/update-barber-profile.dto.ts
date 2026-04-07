import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min, } from 'class-validator';
import { Transform, Type } from 'class-transformer';
const MAX_DISPLAY_NAME = 255;
const MAX_BIO = 2000;
export class UpdateBarberProfileDto {
    @ApiProperty({
        required: false,
        example: 'João Barbeiro',
        description: 'Nome de exibição (máx. 255 caracteres)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(MAX_DISPLAY_NAME)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    displayName?: string;
    @ApiProperty({
        required: false,
        example: 'https://example.com/avatar.jpg',
        description: 'URL do avatar (deve ser URL válida)',
    })
    @IsOptional()
    @IsUrl()
    avatarUrl?: string;
    @ApiProperty({
        required: false,
        example: 5,
        description: 'Anos de experiência (>= 0)',
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0, { message: 'experienceYears não pode ser negativo' })
    experienceYears?: number;
    @ApiProperty({
        required: false,
        nullable: true,
        example: 'Especialista em cortes modernos',
        description: 'Bio opcional (máx. 2000 caracteres)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(MAX_BIO)
    @Transform(({ value }) => value === '' || value === undefined ? undefined : value?.trim())
    bio?: string | null;
}
