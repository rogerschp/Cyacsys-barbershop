import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { FindOptionalMembershipByTenantAndUserUseCase } from '../../tenant-user/use-cases/find-optional-membership-by-tenant-and-user.use-case';
import {
  IProfessionalProfileRepository,
  PROFESSIONAL_PROFILE_REPOSITORY,
} from '../../professional-profile/interfaces/professional-profile-repository.interface';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from '../interfaces/review-repository.interface';

@Injectable()
export class DeleteReviewUseCase {
  private readonly logger = new Logger(DeleteReviewUseCase.name);

  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    private readonly findOptionalMembershipByTenantAndUserUseCase: FindOptionalMembershipByTenantAndUserUseCase,
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
  ) {}

  async run(
    reviewId: string,
    performedBy: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<void> {
    const review = await this.reviewRepository.findByIdAndTarget(
      reviewId,
      targetType,
      targetId,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const canDelete = await this.canDeleteReview(
      performedBy,
      review.reviewerUserId,
      targetType,
      targetId,
    );
    if (!canDelete) {
      throw new ForbiddenException('Not allowed to delete this review');
    }

    await this.reviewRepository.softDelete(reviewId);

    this.logger.log({
      event: 'review_deleted',
      reviewId,
      performedBy,
      timestamp: new Date().toISOString(),
    });
  }

  private async canDeleteReview(
    performedBy: string,
    authorUserId: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<boolean> {
    if (performedBy === authorUserId) {
      return true;
    }

    if (targetType === ReviewTargetType.TENANT) {
      const membership =
        await this.findOptionalMembershipByTenantAndUserUseCase.run(
          targetId,
          performedBy,
        );
      return (
        !!membership &&
        (membership.role === TenantUserRole.OWNER ||
          membership.role === TenantUserRole.ADMIN)
      );
    }

    const profile = await this.professionalProfileRepository.findById(targetId);
    return profile?.userId === performedBy;
  }
}
