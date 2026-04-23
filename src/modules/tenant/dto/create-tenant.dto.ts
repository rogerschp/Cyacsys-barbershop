import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CreateTenantDto {
    @ApiProperty({ example: 'Barbearia do Vitinho' })
    @IsString()
    @IsNotEmpty()
    name: string;
    @ApiProperty({
        example: 'barbearia-do-vitinho',
        required: false,
        description: 'Opcional. Se omitido, é gerado a partir do nome (normalizado). Se informado, será normalizado no servidor. Imutável após criação.',
    })
    @IsOptional()
    @IsString()
    slug?: string;
}
