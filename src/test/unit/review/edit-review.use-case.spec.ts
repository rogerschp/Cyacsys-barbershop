import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { EditReviewUseCase } from 'src/modules/review/use-cases/edit-review.use-case';
import { REVIEW_REPOSITORY } from 'src/modules/review/interfaces/review-repository.interface';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';

describe('EditReviewUseCase', () => {
  let useCase: EditReviewUseCase;
  const reviewRepo = {
    findByIdAndTarget: jest.fn(),
    update: jest.fn(),
  };

  const baseReview = {
    id: 'review-1',
    reviewerUserId: 'author-1',
    rating: 5,
    comment: 'ok',
    isEdited: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditReviewUseCase,
        { provide: REVIEW_REPOSITORY, useValue: reviewRepo },
      ],
    }).compile();
    useCase = module.get(EditReviewUseCase);
    reviewRepo.findByIdAndTarget.mockResolvedValue(baseReview);
    reviewRepo.update.mockResolvedValue({ ...baseReview, isEdited: true });
  });

  it('edita avaliação do autor', async () => {
    await useCase.run(
      'review-1',
      'author-1',
      ReviewTargetType.TENANT,
      'tenant-1',
      { rating: 4 },
    );
    expect(reviewRepo.update).toHaveBeenCalledWith(
      'review-1',
      expect.objectContaining({ isEdited: true, rating: 4 }),
    );
  });

  it('nega edição de não autor', async () => {
    await expect(
      useCase.run('review-1', 'other', ReviewTargetType.TENANT, 'tenant-1', {
        rating: 3,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lança REVIEW_ALREADY_EDITED na segunda edição', async () => {
    reviewRepo.findByIdAndTarget.mockResolvedValue({
      ...baseReview,
      isEdited: true,
    });
    await expect(
      useCase.run('review-1', 'author-1', ReviewTargetType.TENANT, 'tenant-1', {
        rating: 3,
      }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });
});
