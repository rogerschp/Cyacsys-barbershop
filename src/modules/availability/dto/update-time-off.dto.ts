import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, Matches, ValidateIf } from 'class-validator';
import { TimeOffReason } from '../entities/time-off-reason.enum';
export class UpdateTimeOffDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.startTime != null && o.startTime !== '')
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string | null;
  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.endTime != null && o.endTime !== '')
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string | null;
  @ApiProperty({ enum: TimeOffReason, required: false })
  @IsOptional()
  @IsEnum(TimeOffReason)
  reason?: TimeOffReason;
}
