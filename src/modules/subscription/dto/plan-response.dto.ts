import { ApiProperty } from '@nestjs/swagger';
import {
  CustomizationLevel,
  ReportsLevel,
} from '../entities/plan-features.interface';

export class PlanFeaturesDto {
  @ApiProperty({ enum: ['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED'] })
  reports: ReportsLevel;

  @ApiProperty({ example: false })
  reportExport: boolean;

  @ApiProperty({ example: true })
  reviews: boolean;

  @ApiProperty({ example: true })
  marketplace: boolean;

  @ApiProperty({ example: false })
  regionalHighlight: boolean;

  @ApiProperty({ example: false })
  eliteBadge: boolean;

  @ApiProperty({ example: false })
  whatsappNotification: boolean;

  @ApiProperty({ enum: ['NONE', 'BASIC', 'INTERMEDIATE', 'FULL'] })
  customization: CustomizationLevel;

  @ApiProperty({ nullable: true, example: null })
  maxProfessionals: number | null;
}

export class PlanResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'STANDARD' })
  name: string;

  @ApiProperty({ example: 'MONTHLY' })
  billingCycle: string;

  @ApiProperty({ example: '89.90' })
  price: string;

  @ApiProperty({ example: 1 })
  sortWeight: number;

  @ApiProperty({ example: 5 })
  gracePeriodDays: number;

  @ApiProperty({ type: PlanFeaturesDto })
  features: PlanFeaturesDto;

  @ApiProperty({ example: true })
  isActive: boolean;
}
