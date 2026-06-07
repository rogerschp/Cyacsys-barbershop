import { ApiProperty } from '@nestjs/swagger';
import { MonthlyMetricsDto } from './monthly-metrics.dto';
import { ProfessionalMetricsDto } from './professional-metrics.dto';
import { ReportPeriodDto } from './report-period.dto';

export class EliteReportDto {
  @ApiProperty({ type: ReportPeriodDto })
  period: ReportPeriodDto;

  @ApiProperty({ example: 18500.0 })
  revenue: number;

  @ApiProperty({ example: 480 })
  confirmedBookings: number;

  @ApiProperty({ example: 32 })
  cancelledBookings: number;

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
