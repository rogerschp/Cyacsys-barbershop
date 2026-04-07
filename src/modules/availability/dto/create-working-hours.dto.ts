import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsOptional, ValidateNested, } from 'class-validator';
import { DayOfWeek } from '../entities/day-of-week.enum';
import { WorkingHoursPeriodInputDto } from './working-hours-period-input.dto';
export class CreateWorkingHoursDto {
    @ApiProperty({ enum: DayOfWeek })
    @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;
    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
    @ApiProperty({
        type: [WorkingHoursPeriodInputDto],
        required: false,
        description: 'Obrigatório se isActive for true: pelo menos um período.',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkingHoursPeriodInputDto)
    periods?: WorkingHoursPeriodInputDto[];
}
