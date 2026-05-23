import { ApiProperty } from '@nestjs/swagger';
export class AvailableSlotsResponseDto {
  @ApiProperty({ example: '2026-03-21' })
  date: string;
  @ApiProperty({
    example: 'America/Sao_Paulo',
    description: 'Fuso usado para interpretar a data e horários retornados',
  })
  timezone: string;
  @ApiProperty({
    example: ['09:00', '10:00', '11:00'],
    description: 'Horários de início possíveis (HH:mm) no fuso do tenant',
  })
  slots: string[];
}
