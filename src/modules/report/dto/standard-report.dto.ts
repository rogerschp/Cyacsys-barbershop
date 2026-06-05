import { ApiProperty } from '@nestjs/swagger';
import { ReportPeriodDto } from './report-period.dto';

export class StandardReportDto {
  @ApiProperty({ type: ReportPeriodDto })
  period: ReportPeriodDto;

  @ApiProperty({ example: 3200.0 })
  revenue: number;

  @ApiProperty({ example: 85 })
  confirmedBookings: number;

  @ApiProperty({ example: 5 })
  cancelledBookings: number;

  @ApiProperty({
    nullable: true,
    example: null,
    description: 'Reservado para insights de IA futura',
  })
  insights: null;
}
