import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking-status.enum';

export class OpsBookingCustomerDto {
  @ApiProperty({ enum: ['USER', 'GUEST'] })
  kind: 'USER' | 'GUEST';

  @ApiPropertyOptional({ nullable: true })
  clientUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestPhone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  guestEmail?: string | null;
}

export class OpsBookingProfessionalDto {
  @ApiProperty()
  tenantProfessionalId: string;

  @ApiProperty()
  professionalProfileId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;
}

export class OpsBookingServiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  durationInMinutes: number;
}

export class OpsBookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ example: '2026-04-06', description: 'Data no fuso do tenant' })
  date: string;

  @ApiProperty({ example: '14:00' })
  startTime: string;

  @ApiProperty({ example: '14:30' })
  endTime: string;

  @ApiProperty({ description: 'Início em UTC (ISO 8601)' })
  startsAt: string;

  @ApiProperty({ description: 'Fim em UTC (ISO 8601)' })
  endsAt: string;

  @ApiProperty({ type: OpsBookingProfessionalDto })
  professional: OpsBookingProfessionalDto;

  @ApiProperty({ type: OpsBookingServiceDto })
  service: OpsBookingServiceDto;

  @ApiProperty({ type: OpsBookingCustomerDto })
  customer: OpsBookingCustomerDto;
}
