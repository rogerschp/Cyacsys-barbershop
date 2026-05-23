import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking-status.enum';

export class MyBookingTenantAddressDto {
  @ApiProperty()
  street: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  country: string;
}

export class MyBookingTenantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  telephone: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ type: MyBookingTenantAddressDto, nullable: true })
  address: MyBookingTenantAddressDto | null;
}

export class MyBookingProfessionalDto {
  @ApiProperty()
  tenantProfessionalId: string;

  @ApiProperty()
  displayName: string;
}

export class MyBookingServiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  durationInMinutes: number;
}

export class MyBookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ type: MyBookingTenantDto })
  tenant: MyBookingTenantDto;

  @ApiProperty({ type: MyBookingProfessionalDto })
  professional: MyBookingProfessionalDto;

  @ApiProperty({ type: MyBookingServiceDto })
  service: MyBookingServiceDto;

  @ApiProperty({ example: '2026-04-06', description: 'Data no fuso do tenant' })
  date: string;

  @ApiProperty({ example: '14:00', description: 'Início no fuso do tenant' })
  startTime: string;

  @ApiProperty({ example: '14:30', description: 'Fim no fuso do tenant' })
  endTime: string;

  @ApiProperty({ description: 'Início em UTC (ISO 8601)' })
  startsAt: string;

  @ApiProperty({ description: 'Fim em UTC (ISO 8601)' })
  endsAt: string;
}
