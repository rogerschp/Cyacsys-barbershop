import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { BorderRadiusOpcao } from '../enums/border-radius-opcao.enum';
import { FonteDisponivel } from '../enums/fonte-disponivel.enum';
import { SecaoLayoutDto } from './secao-layout.dto';

export class UpsertTenantThemeDto {
  @ApiProperty({ example: '#1A1A2E' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'corPrimaria deve ser hex válido (#RRGGBB)',
  })
  corPrimaria: string;

  @ApiProperty({ example: '#E94560' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'corSecundaria deve ser hex válido (#RRGGBB)',
  })
  corSecundaria: string;

  @ApiProperty({ example: '#FFFFFF' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'corFundo deve ser hex válido (#RRGGBB)',
  })
  corFundo: string;

  @ApiProperty({ example: '#16213E' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'corTexto deve ser hex válido (#RRGGBB)',
  })
  corTexto: string;

  @ApiProperty({ enum: FonteDisponivel, example: FonteDisponivel.INTER })
  @IsEnum(FonteDisponivel)
  fonte: FonteDisponivel;

  @ApiProperty({ enum: BorderRadiusOpcao, example: BorderRadiusOpcao.MD })
  @IsEnum(BorderRadiusOpcao)
  borderRadius: BorderRadiusOpcao;

  @ApiProperty({ type: [SecaoLayoutDto] })
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => SecaoLayoutDto)
  secoesLayout: SecaoLayoutDto[];
}
