import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class CreateBookingDraftDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  serviceId: string;

  @ApiProperty({ example: '2026-04-06', description: 'Data no calendário do tenant (yyyy-MM-dd)' })
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
