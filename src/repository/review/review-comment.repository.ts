import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewCommentEntity } from '../../modules/review/entities/review-comment.entity';
import {
  CreateReviewCommentData,
  IReviewCommentRepository,
} from '../../modules/review/interfaces/review-repository.interface';

@Injectable()
export class ReviewCommentRepository implements IReviewCommentRepository {
  constructor(
    @InjectRepository(ReviewCommentEntity)
    private readonly repo: Repository<ReviewCommentEntity>,
  ) {}

  async create(data: CreateReviewCommentData): Promise<ReviewCommentEntity> {
    const entity = this.repo.create({
      reviewId: data.reviewId,
      authorUserId: data.authorUserId,
      body: data.body,
    });
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<ReviewCommentEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['author', 'review'],
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
