import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../../tenant-user/interfaces/tenant-user-repository.interface';
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
    @Inject(TENANT_USER_REPOSITORY)
    private readonly tenantUserRepository: ITenantUserRepository,
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
      const membership = await this.tenantUserRepository.findByTenantAndUser(
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
