import { ReviewEntity } from '../entities/review.entity';
import { ReviewResponseDto } from '../dto/review-response.dto';

export class ReviewMapper {
  static toResponse(review: ReviewEntity): ReviewResponseDto {
    return {
      id: review.id,
      reviewerUserId: review.reviewerUserId,
      reviewerName: review.reviewer?.name ?? '',
      targetType: review.targetType,
      targetId: review.targetId,
      rating: review.rating,
      comment: review.comment,
      isEdited: review.isEdited,
      editedAt: review.editedAt,
      reply: review.reply,
      repliedAt: review.repliedAt,
      repliedByUserId: review.repliedByUserId,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
