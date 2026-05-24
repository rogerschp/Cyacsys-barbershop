import { ReviewEntity } from '../entities/review.entity';
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
  isEdited?: boolean;
  editedAt?: Date | null;
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
