import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../../tenant-user/interfaces/tenant-user-repository.interface';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import {
  IProfessionalProfileRepository,
  PROFESSIONAL_PROFILE_REPOSITORY,
} from '../../professional-profile/interfaces/professional-profile-repository.interface';
import { CreateReviewDto } from '../dto/create-review.dto';
import { ReviewEntity } from '../entities/review.entity';
import { ReviewTargetType } from '../entities/review-target-type.enum';
import {
  IReviewRepository,
  REVIEW_REPOSITORY,
} from '../interfaces/review-repository.interface';

@Injectable()
export class CreateReviewUseCase {
  private readonly logger = new Logger(CreateReviewUseCase.name);

  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
    @Inject(TENANT_USER_REPOSITORY)
    private readonly tenantUserRepository: ITenantUserRepository,
  ) {}

  async run(
    reviewerUserId: string,
    targetType: ReviewTargetType,
    targetId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewEntity> {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BusinessRuleException(
        'INVALID_RATING',
        'A nota deve estar entre 1 e 5.',
      );
    }

    await this.assertTargetExists(targetType, targetId);
    await this.assertCanReviewTarget(reviewerUserId, targetType, targetId);

    const existing = await this.reviewRepository.findActiveByReviewerAndTarget(
      reviewerUserId,
      targetType,
      targetId,
    );
    if (existing) {
      throw new BusinessRuleException(
        'REVIEW_ALREADY_EXISTS',
        'Você já avaliou este alvo.',
      );
    }

    const review = await this.reviewRepository.create({
      reviewerUserId,
      targetType,
      targetId,
      rating: dto.rating,
      comment: dto.comment?.trim() ?? null,
    });

    this.logger.log({
      event: 'review_created',
      reviewId: review.id,
      reviewerUserId,
      targetType,
      targetId,
      rating: review.rating,
      timestamp: new Date().toISOString(),
    });

    const saved = await this.reviewRepository.findById(review.id);
    if (!saved) {
      throw new Error('Review not found after create');
    }
    return saved;
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

  private async assertCanReviewTarget(
    reviewerUserId: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<void> {
    if (targetType === ReviewTargetType.TENANT) {
      const membership = await this.tenantUserRepository.findByTenantAndUser(
        targetId,
        reviewerUserId,
      );
      if (
        membership &&
        (membership.role === TenantUserRole.OWNER ||
          membership.role === TenantUserRole.ADMIN)
      ) {
        throw new BusinessRuleException(
          'CANNOT_REVIEW_YOURSELF',
          'Proprietários e administradores não podem avaliar o próprio estabelecimento.',
        );
      }
      return;
    }

    const profile = await this.professionalProfileRepository.findById(targetId);
    if (profile?.userId === reviewerUserId) {
      throw new BusinessRuleException(
        'CANNOT_REVIEW_YOURSELF',
        'Profissionais não podem avaliar o próprio perfil.',
      );
    }
  }
}
