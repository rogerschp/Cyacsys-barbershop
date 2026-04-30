import { ApiProperty } from '@nestjs/swagger';
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
    description:
      'ACTIVE = operação normal; INACTIVE = desativado; SUSPENDED = bloqueio (inadimplência/manual)',
  })
  status: string;
  @ApiProperty({ example: '5511932457854' })
  telephone: string;
  @ApiProperty({ type: AddressResponseDto, nullable: true })
  address: AddressResponseDto | null;
}
