import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking-status.enum';

export class BookingResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  tenantProfessionalId: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty({ description: 'Início do agendamento (ISO UTC)' })
  startsAt: string;

  @ApiProperty({ description: 'Fim do agendamento (ISO UTC)' })
  endsAt: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ nullable: true })
  clientUserId: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
