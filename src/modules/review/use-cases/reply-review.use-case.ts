import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../../tenant-user/interfaces/tenant-user-repository.interface';
import {
  IProfessionalProfileRepository,
  PROFESSIONAL_PROFILE_REPOSITORY,
} from '../../professional-profile/interfaces/professional-profile-repository.interface';
import { ReplyReviewDto } from '../dto/reply-review.dto';
import { ReviewEntity } from '../entities/review.entity';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from '../interfaces/review-repository.interface';

@Injectable()
export class ReplyReviewUseCase {
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
    userId: string,
    targetType: ReviewTargetType,
    targetId: string,
    dto: ReplyReviewDto,
  ): Promise<ReviewEntity> {
    const review = await this.reviewRepository.findByIdAndTarget(
      reviewId,
      targetType,
      targetId,
    );
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.assertCanReply(userId, targetType, targetId);

    return this.reviewRepository.update(reviewId, {
      reply: dto.reply.trim(),
      repliedAt: new Date(),
      repliedByUserId: userId,
    });
  }

  private async assertCanReply(
    userId: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<void> {
    if (targetType === ReviewTargetType.TENANT) {
      const membership = await this.tenantUserRepository.findByTenantAndUser(
        targetId,
        userId,
      );
      if (
        !membership ||
        (membership.role !== TenantUserRole.OWNER &&
          membership.role !== TenantUserRole.ADMIN)
      ) {
        throw new ForbiddenException(
          'Only tenant OWNER or ADMIN can reply to reviews',
        );
      }
      return;
    }

    const profile = await this.professionalProfileRepository.findById(targetId);
    if (!profile || profile.userId !== userId) {
      throw new ForbiddenException(
        'Only the professional profile owner can reply to reviews',
      );
    }
  }
}
