import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '../entities/day-of-week.enum';
import { WorkingHoursPeriodInputDto } from './working-hours-period-input.dto';

export class BootstrapWorkingWeekDto {
  @ApiProperty({
    enum: DayOfWeek,
    isArray: true,
    required: false,
    description:
      'Dias em que a barbearia fica fechada. Os demais dias da semana serão configurados como abertos.',
    example: [DayOfWeek.SUNDAY],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(DayOfWeek, { each: true })
  closedDays?: DayOfWeek[];

  @ApiProperty({
    type: [WorkingHoursPeriodInputDto],
    description: 'Períodos padrão para os dias abertos.',
    example: [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '18:00' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursPeriodInputDto)
  periods: WorkingHoursPeriodInputDto[];

  @ApiProperty({
    required: false,
    default: true,
    description:
      'Quando true, substitui períodos existentes e ajusta ativo/inativo para toda a semana.',
  })
  @IsOptional()
  @IsBoolean()
  overwriteExisting?: boolean;
}
