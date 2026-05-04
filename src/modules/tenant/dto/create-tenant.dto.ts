import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsObject,
  Matches,
} from 'class-validator';

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
    description: 'Telefone com DDI e DDD (formato E.164)',
  })
  @IsNotEmpty()
  @IsPhoneNumber() // Valida automaticamente formatos internacionais
  telephone: string;

  @ApiPropertyOptional({
    example: '12345678000199',
    description: 'CNPJ apenas números',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 números' })
  cnpj?: string;

  @ApiPropertyOptional({
    example: { instagram: 'vitinho_barber', facebook: 'barbeariavitinho' },
    description: 'Objeto com as redes sociais',
  })
  @IsOptional()
  @IsObject()
  socialMedia?: Record<string, string>;
}
