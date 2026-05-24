import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import {
  IProfessionalProfileRepository,
  PROFESSIONAL_PROFILE_REPOSITORY,
} from '../../professional-profile/interfaces/professional-profile-repository.interface';
import { ReviewListResponseDto } from '../dto/review-response.dto';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from '../interfaces/review-repository.interface';
import { ReviewMapper } from '../mappers/review.mapper';

@Injectable()
export class ListReviewsUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
  ) {}

  async run(
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewListResponseDto> {
    await this.assertTargetExists(targetType, targetId);

    const aggregate = await this.reviewRepository.listByTarget(
      targetType,
      targetId,
    );

    return {
      averageRating: aggregate.averageRating,
      totalReviews: aggregate.totalReviews,
      reviews: aggregate.reviews.map((r) => ReviewMapper.toResponse(r)),
    };
  }

  private async assertTargetExists(
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<void> {
    if (targetType === ReviewTargetType.TENANT) {
      await this.findTenantByIdUseCase.run(targetId);
      return;
    }
    const profile = await this.professionalProfileRepository.findById(targetId);
    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }
  }
}
