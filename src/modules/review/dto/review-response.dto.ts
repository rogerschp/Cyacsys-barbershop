import { ApiProperty } from '@nestjs/swagger';
import { ReviewTargetType } from '../entities/review-target-type.enum';

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewerUserId: string;

  @ApiProperty({ example: 'João Silva' })
  reviewerName: string;

  @ApiProperty({ enum: ReviewTargetType })
  targetType: ReviewTargetType;

  @ApiProperty()
  targetId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty({ nullable: true })
  comment: string | null;

  @ApiProperty()
  isEdited: boolean;

  @ApiProperty({ nullable: true })
  editedAt: Date | null;

  @ApiProperty({ nullable: true })
  reply: string | null;

  @ApiProperty({ nullable: true })
  repliedAt: Date | null;

  @ApiProperty({ nullable: true })
  repliedByUserId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ReviewListResponseDto {
  @ApiProperty({ example: 4.7 })
  averageRating: number;

  @ApiProperty({ example: 123 })
  totalReviews: number;

  @ApiProperty({ type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];
}
