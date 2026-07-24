import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ example: 3200.0 })
  revenue: number;

  @ApiProperty({ example: 85 })
  completedBookings: number;

  @ApiProperty({ example: 5 })
  cancelledBookings: number;

  @ApiProperty({
    example: 5.56,
    description: 'Cancelados / (Concluídos + Cancelados) * 100',
  })
  cancellationRate: number;

  @ApiProperty({
    example: 37.65,
    description: 'Receita / atendimentos válidos (COMPLETED)',
  })
  averageTicket: number;

  @ApiProperty({
    example: 12,
    description:
      'Clientes cujo primeiro atendimento (COMPLETED) caiu no período',
  })
  newCustomers: number;

  @ApiProperty({
    example: 8,
    description:
      'Clientes com atendimento anterior ao período e novo atendimento no período',
  })
  returningCustomers: number;
}
