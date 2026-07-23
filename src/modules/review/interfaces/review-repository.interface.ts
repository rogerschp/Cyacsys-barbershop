import { ReviewEntity } from '../entities/review.entity';
import { ReviewCommentEntity } from '../entities/review-comment.entity';
import { ReviewTargetType } from '../entities/review-target-type.enum';

export interface CreateReviewData {
  reviewerUserId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string | null;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string | null;
  reply?: string | null;
  repliedAt?: Date | null;
  repliedByUserId?: string | null;
}

export interface ReviewListAggregate {
  averageRating: number;
  totalReviews: number;
  reviews: ReviewEntity[];
}

export interface IReviewRepository {
  create(data: CreateReviewData): Promise<ReviewEntity>;
  findById(id: string): Promise<ReviewEntity | null>;
  findByIdAndTarget(
    id: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewEntity | null>;
  findActiveByReviewerAndTarget(
    reviewerUserId: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewEntity | null>;
  listByTarget(
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewListAggregate>;
  update(id: string, data: UpdateReviewData): Promise<ReviewEntity>;
  softDelete(id: string): Promise<void>;
}

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface CreateReviewCommentData {
  reviewId: string;
  authorUserId: string;
  body: string;
}

export interface IReviewCommentRepository {
  create(data: CreateReviewCommentData): Promise<ReviewCommentEntity>;
  findById(id: string): Promise<ReviewCommentEntity | null>;
  softDelete(id: string): Promise<void>;
}

export const REVIEW_COMMENT_REPOSITORY = Symbol('REVIEW_COMMENT_REPOSITORY');
