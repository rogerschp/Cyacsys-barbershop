import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateReviewCommentUseCase } from 'src/modules/review/use-cases/create-review-comment.use-case';
import {
  REVIEW_COMMENT_REPOSITORY,
  REVIEW_REPOSITORY,
} from 'src/modules/review/interfaces/review-repository.interface';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';
import { DeleteReviewCommentUseCase } from 'src/modules/review/use-cases/delete-review-comment.use-case';

describe('Review comments use cases', () => {
  const reviewRepo = { findByIdAndTarget: jest.fn() };
  const commentRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateReviewCommentUseCase', () => {
    let useCase: CreateReviewCommentUseCase;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CreateReviewCommentUseCase,
          { provide: REVIEW_REPOSITORY, useValue: reviewRepo },
          { provide: REVIEW_COMMENT_REPOSITORY, useValue: commentRepo },
        ],
      }).compile();
      useCase = module.get(CreateReviewCommentUseCase);
      reviewRepo.findByIdAndTarget.mockResolvedValue({
        id: 'r1',
        reviewerUserId: 'author-1',
      });
      commentRepo.create.mockResolvedValue({
        id: 'c1',
        reviewId: 'r1',
        authorUserId: 'author-1',
        body: 'Voltei hoje',
      });
    });

    it('cria comentário do autor da review', async () => {
      const result = await useCase.run(
        'r1',
        'author-1',
        ReviewTargetType.TENANT,
        'tenant-1',
        { body: 'Voltei hoje' },
      );
      expect(result.id).toBe('c1');
      expect(commentRepo.create).toHaveBeenCalled();
    });

    it('permite múltiplos comentários', async () => {
      await useCase.run('r1', 'author-1', ReviewTargetType.TENANT, 'tenant-1', {
        body: 'um',
      });
      await useCase.run('r1', 'author-1', ReviewTargetType.TENANT, 'tenant-1', {
        body: 'dois',
      });
      expect(commentRepo.create).toHaveBeenCalledTimes(2);
    });

    it('nega comentário sem review', async () => {
      reviewRepo.findByIdAndTarget.mockResolvedValue(null);
      await expect(
        useCase.run('r1', 'author-1', ReviewTargetType.TENANT, 'tenant-1', {
          body: 'x',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('nega comentário de não autor', async () => {
      await expect(
        useCase.run('r1', 'other', ReviewTargetType.TENANT, 'tenant-1', {
          body: 'x',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('DeleteReviewCommentUseCase', () => {
    let useCase: DeleteReviewCommentUseCase;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DeleteReviewCommentUseCase,
          { provide: REVIEW_COMMENT_REPOSITORY, useValue: commentRepo },
        ],
      }).compile();
      useCase = module.get(DeleteReviewCommentUseCase);
      commentRepo.findById.mockResolvedValue({
        id: 'c1',
        authorUserId: 'author-1',
      });
    });

    it('soft delete do autor', async () => {
      await useCase.run('c1', 'author-1');
      expect(commentRepo.softDelete).toHaveBeenCalledWith('c1');
    });
  });
});
