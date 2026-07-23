import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewRepository } from '../../repository/review/review.repository';
import { ReviewCommentRepository } from '../../repository/review/review-comment.repository';
import { AuthModule } from '../auth/auth.module';
import { BookingModule } from '../booking/booking.module';
import { ProfessionalProfileModule } from '../professional-profile/professional-profile.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantProfessionalModule } from '../tenant-professional/tenant-professional.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { TenantReviewController } from './controllers/tenant-review.controller';
import {
  MyProfessionalReviewController,
  ProfessionalReviewByUserController,
} from './controllers/professional-review.controller';
import { ReviewEntity } from './entities/review.entity';
import { ReviewCommentEntity } from './entities/review-comment.entity';
import {
  REVIEW_COMMENT_REPOSITORY,
  REVIEW_REPOSITORY,
} from './interfaces/review-repository.interface';
import { UpsertReviewUseCase } from './use-cases/create-review.use-case';
import { CreateReviewCommentUseCase } from './use-cases/create-review-comment.use-case';
import { DeleteReviewCommentUseCase } from './use-cases/delete-review-comment.use-case';
import { DeleteReviewUseCase } from './use-cases/delete-review.use-case';
import { EditReviewUseCase } from './use-cases/edit-review.use-case';
import { ListReviewsUseCase } from './use-cases/list-reviews.use-case';
import { ReplyReviewUseCase } from './use-cases/reply-review.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, ReviewCommentEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
    forwardRef(() => ProfessionalProfileModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => TenantProfessionalModule),
    forwardRef(() => BookingModule),
  ],
  controllers: [
    TenantReviewController,
    ProfessionalReviewByUserController,
    MyProfessionalReviewController,
  ],
  providers: [
    ReviewRepository,
    { provide: REVIEW_REPOSITORY, useClass: ReviewRepository },
    ReviewCommentRepository,
    { provide: REVIEW_COMMENT_REPOSITORY, useClass: ReviewCommentRepository },
    UpsertReviewUseCase,
    EditReviewUseCase,
    ReplyReviewUseCase,
    DeleteReviewUseCase,
    ListReviewsUseCase,
    CreateReviewCommentUseCase,
    DeleteReviewCommentUseCase,
  ],
  exports: [REVIEW_REPOSITORY, ListReviewsUseCase],
})
export class ReviewModule {}
