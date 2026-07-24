import { ApiProperty } from '@nestjs/swagger';
import { DashboardSummaryDto } from './dashboard-summary.dto';
import { ReportPeriodDto } from './report-period.dto';
import { TopServiceMetricsDto } from './top-service-metrics.dto';

export class StandardReportDto {
  @ApiProperty({ type: ReportPeriodDto })
  period: ReportPeriodDto;

  @ApiProperty({
    example: 3200.0,
    description: 'Compat: espelha dashboard.revenue',
  })
  revenue: number;

  @ApiProperty({
    example: 85,
    description: 'Compat: espelha dashboard.completedBookings',
  })
  completedBookings: number;

  @ApiProperty({
    example: 5,
    description: 'Compat: espelha dashboard.cancelledBookings',
  })
  cancelledBookings: number;

  @ApiProperty({ type: DashboardSummaryDto })
  dashboard: DashboardSummaryDto;

  @ApiProperty({ type: [TopServiceMetricsDto] })
  topServices: TopServiceMetricsDto[];

  @ApiProperty({
    nullable: true,
    example: null,
    description: 'Reservado para insights de IA futura',
    type: Object,
  })
  insights: object | null;
}
