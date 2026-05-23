import { ApiProperty } from '@nestjs/swagger';
export class ServiceResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  tenantId: string;
  @ApiProperty({ example: 'Corte masculino' })
  name: string;
  @ApiProperty({
    nullable: true,
    example: 'Corte moderno com máquina e tesoura',
  })
  description: string | null;
  @ApiProperty({ example: '45.00' })
  price: string;
  @ApiProperty({ example: 30 })
  durationInMinutes: number;
  @ApiProperty({ example: true })
  isActive: boolean;
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
