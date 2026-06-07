import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';
import { AddressResponseDto } from 'src/modules/address/dto/address-response.dto';

export class TenantResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({
    example: 'barbearia-do-vitinho',
    description:
      'Identidade pública na URL. Único globalmente e imutável após criação.',
  })
  slug: string;

  @ApiProperty({
    example: 'Barbearia do Vitinho',
    description: 'Nome da barbearia',
  })
  name: string;

  @ApiProperty({
    example: 'ACTIVE',
    description:
      'ACTIVE = operação normal; INACTIVE = desativado; SUSPENDED = bloqueio',
  })
  status: string;

  @ApiProperty({
    example: '5511932457854',
    description: 'Telefone formatado para exibição ou link de WhatsApp',
  })
  telephone: string;

  @ApiPropertyOptional({
    example: '12345678000199',
    description: 'CNPJ da unidade (se houver)',
  })
  cnpj?: string | null;

  @ApiPropertyOptional({
    example: { instagram: '@vitinho_barber', facebook: 'barbeariavitinho' },
    description:
      'Objeto de redes sociais para montagem de ícones/links no front',
  })
  socialMedia?: Record<string, string> | null;

  @ApiProperty({ type: AddressResponseDto, nullable: true })
  address: AddressResponseDto | null;

  @ApiProperty({
    example: 'America/Sao_Paulo',
    description: 'Timezone para cálculos de horários no front-end',
  })
  timezone: string;

  @ApiPropertyOptional({ enum: TenantSegment, nullable: true })
  segment?: TenantSegment | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, example: -23.5505199 })
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true, example: -46.6333094 })
  longitude?: number | null;
}
