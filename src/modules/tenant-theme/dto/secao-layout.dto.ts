import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TipoSecao } from '../enums/tipo-secao.enum';
import { VarianteComponente } from '../enums/variante-componente.enum';

export class SecaoLayoutDto {
  @ApiProperty({ example: 'secao-profissionais' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: TipoSecao, example: TipoSecao.PROFISSIONAIS })
  @IsEnum(TipoSecao)
  tipo: TipoSecao;

  @ApiProperty({ example: true })
  @IsBoolean()
  visivel: boolean;

  @ApiProperty({ example: 0, minimum: 0, maximum: 5 })
  @IsInt()
  @Min(0)
  @Max(5)
  ordem: number;

  @ApiProperty({ enum: VarianteComponente, example: VarianteComponente.PADRAO })
  @IsEnum(VarianteComponente)
  variante: VarianteComponente;
}
