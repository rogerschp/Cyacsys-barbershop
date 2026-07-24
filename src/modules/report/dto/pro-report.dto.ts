import { ApiProperty } from '@nestjs/swagger';
import { DashboardSummaryDto } from './dashboard-summary.dto';
import { MonthlyMetricsDto } from './monthly-metrics.dto';
import { ReportPeriodDto } from './report-period.dto';
import { TopServiceMetricsDto } from './top-service-metrics.dto';

export class ProReportDto {
  @ApiProperty({ type: ReportPeriodDto })
  period: ReportPeriodDto;

  @ApiProperty({ example: 9800.0 })
  revenue: number;

  @ApiProperty({ example: 245 })
  completedBookings: number;

  @ApiProperty({ example: 18 })
  cancelledBookings: number;

  @ApiProperty({ type: DashboardSummaryDto })
  dashboard: DashboardSummaryDto;

  @ApiProperty({ type: [TopServiceMetricsDto] })
  topServices: TopServiceMetricsDto[];

  @ApiProperty({ type: [MonthlyMetricsDto] })
  monthlyBreakdown: MonthlyMetricsDto[];

  @ApiProperty({
    nullable: true,
    example: null,
    description: 'Reservado para insights de IA futura',
    type: Object,
  })
  insights: object | null;
}
