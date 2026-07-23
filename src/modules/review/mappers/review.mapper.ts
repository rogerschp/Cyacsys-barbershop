import { ReviewEntity } from '../entities/review.entity';
import { ReviewCommentEntity } from '../entities/review-comment.entity';
import {
  ReviewCommentResponseDto,
  ReviewResponseDto,
} from '../dto/review-response.dto';

export class ReviewMapper {
  static toCommentResponse(
    comment: ReviewCommentEntity,
  ): ReviewCommentResponseDto {
    return {
      id: comment.id,
      reviewId: comment.reviewId,
      authorUserId: comment.authorUserId,
      authorName: comment.author?.name ?? '',
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  static toResponse(review: ReviewEntity): ReviewResponseDto {
    const comments = (review.comments ?? []).filter((c) => !c.deletedAt);
    return {
      id: review.id,
      reviewerUserId: review.reviewerUserId,
      reviewerName: review.reviewer?.name ?? '',
      targetType: review.targetType,
      targetId: review.targetId,
      rating: review.rating,
      comment: review.comment,
      reply: review.reply,
      repliedAt: review.repliedAt,
      repliedByUserId: review.repliedByUserId,
      comments: comments.map((c) => ReviewMapper.toCommentResponse(c)),
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
