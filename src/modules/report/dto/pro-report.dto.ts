import { ApiProperty } from '@nestjs/swagger';
import { MonthlyMetricsDto } from './monthly-metrics.dto';
import { ReportPeriodDto } from './report-period.dto';

export class ProReportDto {
  @ApiProperty({ type: ReportPeriodDto })
  period: ReportPeriodDto;

  @ApiProperty({ example: 9800.0 })
  revenue: number;

  @ApiProperty({ example: 245 })
  confirmedBookings: number;

  @ApiProperty({ example: 18 })
  cancelledBookings: number;

  @ApiProperty({ type: [MonthlyMetricsDto] })
  monthlyBreakdown: MonthlyMetricsDto[];

  @ApiProperty({
    nullable: true,
    example: null,
    description: 'Reservado para insights de IA futura',
  })
  insights: null;
}
