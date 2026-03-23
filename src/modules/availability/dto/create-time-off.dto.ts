import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, Matches, ValidateIf } from 'class-validator';
import { TimeOffReason } from '../entities/time-off-reason.enum';

export class CreateTimeOffDto {
  @ApiProperty({ example: '2026-12-25' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ required: false, nullable: true, example: '09:00' })
  @IsOptional()
  @ValidateIf((o) => o.startTime != null && o.startTime !== '')
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '12:00' })
  @IsOptional()
  @ValidateIf((o) => o.endTime != null && o.endTime !== '')
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string | null;

  @ApiProperty({ enum: TimeOffReason })
  @IsEnum(TimeOffReason)
  reason: TimeOffReason;
}
