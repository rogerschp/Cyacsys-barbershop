import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { CreateAddressDto } from 'src/modules/address/dto/create-address.dto';
import { IsCnpj } from 'src/common/validators/is-cnpj.decorator';
import { IsPhone } from 'src/common/validators/is-phone.decorator';
import {
  EmptyToUndefined,
  NormalizeCnpj,
  NormalizePhone,
} from 'src/common/transformers/brazilian-document.transformers';

export class CreateTenantDto {
  @ApiProperty({ example: 'Barbearia do Vitinho' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'barbearia-do-vitinho',
    description: 'Opcional. Se omitido, é gerado a partir do nome.',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example: '5511992834085',
    description:
      'Telefone com DDI e DDD. Aceita máscara; normalizado para dígitos (ex.: 5511992834085).',
  })
  @NormalizePhone()
  @IsString()
  @IsNotEmpty()
  @IsPhone()
  telephone: string;

  @ApiPropertyOptional({
    example: '11222333000181',
    description:
      'CNPJ com dígitos verificadores. Aceita máscara; normalizado para 14 dígitos.',
  })
  @EmptyToUndefined()
  @NormalizeCnpj()
  @IsOptional()
  @IsString()
  @IsCnpj()
  cnpj?: string;

  @ApiPropertyOptional({
    example: { instagram: 'vitinho_barber', facebook: 'barbeariavitinho' },
    description: 'Objeto com as redes sociais',
  })
  @IsOptional()
  @IsObject()
  socialMedia?: Record<string, string>;

  @ApiPropertyOptional({ type: CreateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}
