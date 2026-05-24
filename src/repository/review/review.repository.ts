import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../../modules/review/entities/review.entity';
import { ReviewTargetType } from '../../modules/review/entities/review-target-type.enum';
import {
  CreateReviewData,
  IReviewRepository,
  ReviewListAggregate,
  UpdateReviewData,
} from '../../modules/review/interfaces/review-repository.interface';

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly repo: Repository<ReviewEntity>,
  ) {}

  async create(data: CreateReviewData): Promise<ReviewEntity> {
    const entity = this.repo.create({
      reviewerUserId: data.reviewerUserId,
      targetType: data.targetType,
      targetId: data.targetId,
      rating: data.rating,
      comment: data.comment,
      isEdited: false,
      editedAt: null,
      reply: null,
      repliedAt: null,
      repliedByUserId: null,
    });
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['reviewer', 'repliedBy'],
    });
  }

  async findByIdAndTarget(
    id: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewEntity | null> {
    return this.repo.findOne({
      where: { id, targetType, targetId },
      relations: ['reviewer', 'repliedBy'],
    });
  }

  async findActiveByReviewerAndTarget(
    reviewerUserId: string,
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewEntity | null> {
    return this.repo.findOne({
      where: { reviewerUserId, targetType, targetId },
    });
  }

  async listByTarget(
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewListAggregate> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reviewer', 'reviewer')
      .leftJoinAndSelect('r.repliedBy', 'repliedBy')
      .where('r.target_type = :targetType', { targetType })
      .andWhere('r.target_id = :targetId', { targetId })
      .andWhere('r.deletedAt IS NULL')
      .orderBy('r.createdAt', 'DESC');

    const reviews = await qb.getMany();

    const stats = await this.repo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'average')
      .addSelect('COUNT(*)', 'total')
      .where('r.target_type = :targetType', { targetType })
      .andWhere('r.target_id = :targetId', { targetId })
      .andWhere('r.deletedAt IS NULL')
      .getRawOne<{ average: string | null; total: string }>();

    const totalReviews = Number(stats?.total ?? 0);
    const averageRating =
      totalReviews === 0
        ? 0
        : Math.round(Number(stats?.average ?? 0) * 10) / 10;

    return { averageRating, totalReviews, reviews };
  }

  async update(id: string, data: UpdateReviewData): Promise<ReviewEntity> {
    await this.repo.update(id, data as Partial<ReviewEntity>);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Review not found after update');
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
