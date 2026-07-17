import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingMode } from '../../professional-profile/entities/booking-mode.enum';
import { ProfessionalType } from '../../professional-profile/entities/professional-type.enum';

export class PublicTenantProfessionalResponseDto {
  @ApiProperty({
    description: 'ID do vínculo tenant-professional (usar na agenda/booking)',
  })
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiProperty()
  avatarUrl: string;

  @ApiProperty({ enum: ProfessionalType })
  professionalType: ProfessionalType;

  @ApiProperty({ enum: BookingMode })
  bookingMode: BookingMode;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Para CTA WhatsApp quando bookingMode = WHATSAPP_ONLY',
  })
  whatsappNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  instagramUsername: string | null;
}
