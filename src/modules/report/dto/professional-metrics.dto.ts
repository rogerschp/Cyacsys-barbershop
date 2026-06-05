import { ApiProperty } from '@nestjs/swagger';

export class ProfessionalMetricsDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tenantProfessionalId: string;

  @ApiProperty({ example: 'João Silva' })
  professionalName: string;

  @ApiProperty({ example: 2800.0 })
  revenue: number;

  @ApiProperty({ example: 75 })
  confirmedBookings: number;

  @ApiProperty({ example: 3 })
  cancelledBookings: number;
}
