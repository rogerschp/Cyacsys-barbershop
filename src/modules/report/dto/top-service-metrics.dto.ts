import { ApiProperty } from '@nestjs/swagger';

export class TopServiceMetricsDto {
  @ApiProperty({ format: 'uuid' })
  serviceId: string;

  @ApiProperty({ example: 'Corte masculino' })
  serviceName: string;

  @ApiProperty({ example: 42 })
  quantity: number;

  @ApiProperty({ example: 2100.0 })
  revenue: number;
}
