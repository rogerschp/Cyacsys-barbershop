import { ApiProperty } from '@nestjs/swagger';
import { BookingMode } from '../entities/booking-mode.enum';
import { ProfessionalType } from '../entities/professional-type.enum';

export class ProfessionalProfileResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ example: 'João Silva' })
  displayName: string;

  @ApiProperty({
    nullable: true,
    example: 'Especialista em cortes modernos',
  })
  bio: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatarUrl: string;

  @ApiProperty({ enum: ProfessionalType, example: ProfessionalType.BARBER })
  professionalType: ProfessionalType;

  @ApiProperty({ enum: BookingMode, example: BookingMode.DIRECT_BOOKING })
  bookingMode: BookingMode;

  @ApiProperty({ nullable: true, example: '5511999999999' })
  whatsappNumber: string | null;

  @ApiProperty({ nullable: true, example: 'joao.profissional' })
  instagramUsername: string | null;

  @ApiProperty({ example: 5 })
  experienceYears: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
