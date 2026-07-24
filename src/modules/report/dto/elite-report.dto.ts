import { ApiProperty } from '@nestjs/swagger';
import { DashboardSummaryDto } from './dashboard-summary.dto';
import { MonthlyMetricsDto } from './monthly-metrics.dto';
import { ProfessionalMetricsDto } from './professional-metrics.dto';
import { ReportPeriodDto } from './report-period.dto';
import { TopServiceMetricsDto } from './top-service-metrics.dto';

export class EliteReportDto {
  @ApiProperty({ type: ReportPeriodDto })
  period: ReportPeriodDto;

  @ApiProperty({ example: 18500.0 })
  revenue: number;

  @ApiProperty({ example: 480 })
  completedBookings: number;

  @ApiProperty({ example: 32 })
  cancelledBookings: number;

  @ApiProperty({ type: DashboardSummaryDto })
  dashboard: DashboardSummaryDto;

  @ApiProperty({ type: [TopServiceMetricsDto] })
  topServices: TopServiceMetricsDto[];

  @ApiProperty({ type: [MonthlyMetricsDto] })
  monthlyBreakdown: MonthlyMetricsDto[];

  @ApiProperty({ type: [ProfessionalMetricsDto] })
  professionalBreakdown: ProfessionalMetricsDto[];

  @ApiProperty({
    nullable: true,
    example: null,
    description: 'Reservado para insights de IA futura',
    type: Object,
  })
  insights: object | null;
}
