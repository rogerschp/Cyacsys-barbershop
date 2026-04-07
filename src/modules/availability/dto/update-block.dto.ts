import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';
import { BlockReason } from '../entities/block-reason.enum';

export class UpdateBlockDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;

  @ApiProperty({
    enum: [BlockReason.LUNCH, BlockReason.PERSONAL],
    required: false,
  })
  @IsOptional()
  @IsIn([BlockReason.LUNCH, BlockReason.PERSONAL])
  reason?: BlockReason.LUNCH | BlockReason.PERSONAL;
}
