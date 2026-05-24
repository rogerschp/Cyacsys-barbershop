import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewRepository } from '../../repository/review/review.repository';
import { AuthModule } from '../auth/auth.module';
import { ProfessionalProfileModule } from '../professional-profile/professional-profile.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { TenantReviewController } from './controllers/tenant-review.controller';
import {
  MyProfessionalReviewController,
  ProfessionalReviewByUserController,
} from './controllers/professional-review.controller';
import { ReviewEntity } from './entities/review.entity';
import { REVIEW_REPOSITORY } from './interfaces/review-repository.interface';
import { CreateReviewUseCase } from './use-cases/create-review.use-case';
import { DeleteReviewUseCase } from './use-cases/delete-review.use-case';
import { EditReviewUseCase } from './use-cases/edit-review.use-case';
import { ListReviewsUseCase } from './use-cases/list-reviews.use-case';
import { ReplyReviewUseCase } from './use-cases/reply-review.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
    forwardRef(() => ProfessionalProfileModule),
  ],
  controllers: [
    TenantReviewController,
    ProfessionalReviewByUserController,
    MyProfessionalReviewController,
  ],
  providers: [
    ReviewRepository,
    { provide: REVIEW_REPOSITORY, useClass: ReviewRepository },
    CreateReviewUseCase,
    EditReviewUseCase,
    ReplyReviewUseCase,
    DeleteReviewUseCase,
    ListReviewsUseCase,
  ],
  exports: [REVIEW_REPOSITORY, ListReviewsUseCase],
})
export class ReviewModule {}
