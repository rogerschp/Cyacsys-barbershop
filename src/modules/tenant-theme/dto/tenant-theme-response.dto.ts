import { ApiProperty } from '@nestjs/swagger';
import { TenantThemeData } from '../interfaces/tenant-theme-data.interface';

export class TenantThemeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tenantId: string;

  @ApiProperty({
    nullable: true,
    description: 'Tema customizado ou null para usar defaults do frontend',
  })
  theme: TenantThemeData | null;

  @ApiProperty({
    example: 'STANDARD',
    description: 'Plano atual: FREE, STANDARD, PRO ou ELITE',
  })
  plan: string;
}
