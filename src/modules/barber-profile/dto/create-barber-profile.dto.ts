import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min, } from 'class-validator';
import { Transform, Type } from 'class-transformer';
const MAX_DISPLAY_NAME = 255;
const MAX_BIO = 2000;
export class CreateBarberProfileDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'ID do TenantUser (deve existir no tenant e ter role BARBER)',
    })
    @IsString()
    @IsNotEmpty()
    tenantUserId: string;
    @ApiProperty({
        example: 'João Barbeiro',
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
    @Transform(({ value }) => value === '' || value === undefined ? undefined : value?.trim())
    bio?: string | null;
}
