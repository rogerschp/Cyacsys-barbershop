import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min, } from 'class-validator';
import { Transform, Type } from 'class-transformer';
const MIN_DURATION = 5;
const MIN_PRICE = 0;
export class UpdateServiceDto {
    @ApiProperty({
        required: false,
        example: 'Corte masculino',
        description: 'Nome do serviço (único por tenant)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    name?: string;
    @ApiProperty({
        required: false,
        nullable: true,
        description: 'Descrição opcional',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    @Transform(({ value }) => value === '' || value === undefined ? undefined : value?.trim())
    description?: string | null;
    @ApiProperty({
        required: false,
        example: 45.0,
        minimum: MIN_PRICE,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(MIN_PRICE, { message: 'Preço não pode ser negativo' })
    price?: number;
    @ApiProperty({
        required: false,
        example: 30,
        minimum: MIN_DURATION,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(MIN_DURATION, { message: 'Duração mínima é 5 minutos' })
    durationInMinutes?: number;
    @ApiProperty({
        required: false,
        description: 'Se o serviço está ativo para agendamento',
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}
