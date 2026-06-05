import { ApiProperty } from '@nestjs/swagger';

export class ReportPeriodDto {
  @ApiProperty({ example: '2026-06-01T03:00:00.000Z' })
  start: Date;

  @ApiProperty({ example: '2026-06-04T23:59:59.999Z' })
  end: Date;
}
