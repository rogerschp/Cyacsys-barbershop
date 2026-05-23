import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
export class WorkingHoursPeriodInputDto {
  @ApiProperty({ example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime deve estar no formato HH:mm (00:00–23:59).',
  })
  startTime: string;
  @ApiProperty({ example: '12:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime deve estar no formato HH:mm (00:00–23:59).',
  })
  endTime: string;
}
