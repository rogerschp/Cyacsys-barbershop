import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { DayOfWeek } from '../entities/day-of-week.enum';
export class UpdateWorkingHoursDto {
  @ApiProperty({ enum: DayOfWeek, required: false })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
