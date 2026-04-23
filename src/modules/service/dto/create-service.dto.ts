import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, } from 'class-validator';
import { Transform, Type } from 'class-transformer';
const MIN_DURATION = 5;
const MIN_PRICE = 0;
export class CreateServiceDto {
    @ApiProperty({
        example: 'Corte masculino',
        description: 'Nome do serviço (único por tenant)',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    name: string;
    @ApiProperty({
        nullable: true,
        example: 'Corte moderno com máquina e tesoura',
        description: 'Descrição opcional',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    @Transform(({ value }) => value === '' || value === undefined ? undefined : value?.trim())
    description?: string | null;
    @ApiProperty({
        example: 45.0,
        description: 'Preço (>= 0)',
        minimum: MIN_PRICE,
    })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(MIN_PRICE, { message: 'Preço não pode ser negativo' })
    price: number;
    @ApiProperty({
        example: 30,
        description: 'Duração em minutos (>= 5)',
        minimum: MIN_DURATION,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(MIN_DURATION, { message: 'Duração mínima é 5 minutos' })
    durationInMinutes: number;
}
