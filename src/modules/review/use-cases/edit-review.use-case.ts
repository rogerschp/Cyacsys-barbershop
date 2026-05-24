import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewEntity } from '../entities/review.entity';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from '../interfaces/review-repository.interface';

@Injectable()
export class EditReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async run(
    reviewId: string,
    userId: string,
    targetType: ReviewTargetType,
    targetId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findByIdAndTarget(
      reviewId,
      targetType,
      targetId,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.reviewerUserId !== userId) {
      throw new ForbiddenException('Only the author can edit this review');
    }
    if (review.isEdited) {
      throw new BusinessRuleException(
        'REVIEW_ALREADY_EDITED',
        'Esta avaliação já foi editada uma vez.',
      );
    }

    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
      throw new BusinessRuleException(
        'INVALID_RATING',
        'A nota deve estar entre 1 e 5.',
      );
    }

    return this.reviewRepository.update(reviewId, {
      rating: dto.rating ?? review.rating,
      comment:
        dto.comment !== undefined
          ? (dto.comment?.trim() ?? null)
          : review.comment,
      isEdited: true,
      editedAt: new Date(),
    });
  }
}
