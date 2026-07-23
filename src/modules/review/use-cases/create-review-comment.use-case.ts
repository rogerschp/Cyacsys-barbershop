import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { CreateReviewCommentDto } from '../dto/create-review-comment.dto';
import { ReviewCommentEntity } from '../entities/review-comment.entity';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import {
  IReviewCommentRepository,
  IReviewRepository,
  REVIEW_COMMENT_REPOSITORY,
  REVIEW_REPOSITORY,
} from '../interfaces/review-repository.interface';

@Injectable()
export class CreateReviewCommentUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    @Inject(REVIEW_COMMENT_REPOSITORY)
    private readonly commentRepository: IReviewCommentRepository,
  ) {}

  async run(
    reviewId: string,
    userId: string,
    targetType: ReviewTargetType,
    targetId: string,
    dto: CreateReviewCommentDto,
  ): Promise<ReviewCommentEntity> {
    const review = await this.reviewRepository.findByIdAndTarget(
      reviewId,
      targetType,
      targetId,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.reviewerUserId !== userId) {
      throw new ForbiddenException(
        'Only the review author can add comments to this review',
      );
    }

    const body = dto.body?.trim();
    if (!body) {
      throw new BusinessRuleException(
        'INVALID_COMMENT',
        'O comentário não pode ser vazio.',
      );
    }

    return this.commentRepository.create({
      reviewId,
      authorUserId: userId,
      body,
    });
  }
}
