import { ApiProperty } from '@nestjs/swagger';

export class MonthlyMetricsDto {
  @ApiProperty({ example: 2026 })
  year: number;

  @ApiProperty({ example: 6, description: 'Mês (1-12)' })
  month: number;

  @ApiProperty({ example: 4500.0, description: 'Faturamento (bookings CONFIRMED)' })
  revenue: number;

  @ApiProperty({ example: 120 })
  confirmedBookings: number;

  @ApiProperty({ example: 8 })
  cancelledBookings: number;

  @ApiProperty({
    example: 12.5,
    nullable: true,
    description: 'Variação % vs mês anterior; null no primeiro mês ou se anterior = 0',
  })
  revenueChangePercent: number | null;
}
