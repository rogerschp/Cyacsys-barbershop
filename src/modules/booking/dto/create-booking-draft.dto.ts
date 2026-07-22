import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class BookingSlotDraftDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  serviceId: string;

  @ApiProperty({
    example: '2026-04-06',
    description: 'Data no calendário do tenant (yyyy-MM-dd)',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be yyyy-MM-dd',
  })
  date: string;

  @ApiProperty({
    example: '14:00',
    description: 'Início do slot (HH:mm), alinhado aos horários disponíveis',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be HH:mm (24h)',
  })
  startTime: string;
}

/** Draft autenticado (cliente logado) — identidade = Bearer. */
export class CreateBookingDraftDto extends BookingSlotDraftDto {}

/** Draft guest — sem login. */
export class CreateGuestBookingDraftDto extends BookingSlotDraftDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  guestName: string;

  @ApiProperty({
    example: '11999999999',
    description: 'Telefone (normalizado no backend)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  guestPhone: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsEmail()
  guestEmail?: string | null;
}

/**
 * Draft ops — identidade XOR:
 * - clientUserId, ou
 * - guestName + guestPhone, ou
 * - nenhum (fallback = usuário autenticado da equipe)
 */
export class CreateOpsBookingDraftDto extends BookingSlotDraftDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  clientUserId?: string;

  @ApiPropertyOptional({ example: 'Maria' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guestName?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  guestPhone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsEmail()
  guestEmail?: string | null;
}
