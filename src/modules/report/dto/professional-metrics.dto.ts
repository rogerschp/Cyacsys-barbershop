import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalMetricsDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tenantProfessionalId: string;

  @ApiProperty({ example: 'João Silva' })
  professionalName: string;

  @ApiProperty({ example: 2800.0 })
  revenue: number;

  @ApiProperty({ example: 75 })
  completedBookings: number;

  @ApiProperty({ example: 3 })
  cancelledBookings: number;

  @ApiProperty({
    example: 37.33,
    description: 'Receita / concluídos do profissional',
  })
  averageTicket: number;

  @ApiProperty({
    example: 3.85,
    description: 'Cancelados / (Concluídos + Cancelados) * 100',
  })
  cancellationRate: number;
}
