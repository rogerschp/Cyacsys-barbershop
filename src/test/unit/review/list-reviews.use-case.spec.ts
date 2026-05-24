import { Test, TestingModule } from '@nestjs/testing';
import { ListReviewsUseCase } from 'src/modules/review/use-cases/list-reviews.use-case';
import { REVIEW_REPOSITORY } from 'src/modules/review/interfaces/review-repository.interface';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';

describe('ListReviewsUseCase', () => {
  let useCase: ListReviewsUseCase;
  const reviewRepo = { listByTarget: jest.fn() };
  const findTenantById = { run: jest.fn() };
  const profRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListReviewsUseCase,
        { provide: REVIEW_REPOSITORY, useValue: reviewRepo },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
        { provide: PROFESSIONAL_PROFILE_REPOSITORY, useValue: profRepo },
      ],
    }).compile();
    useCase = module.get(ListReviewsUseCase);
    findTenantById.run.mockResolvedValue({ id: 'tenant-1' });
    reviewRepo.listByTarget.mockResolvedValue({
      averageRating: 4.5,
      totalReviews: 2,
      reviews: [
        {
          id: 'r1',
          reviewerUserId: 'u1',
          reviewer: { name: 'Ana' },
          targetType: ReviewTargetType.TENANT,
          targetId: 'tenant-1',
          rating: 5,
          comment: null,
          isEdited: false,
          editedAt: null,
          reply: null,
          repliedAt: null,
          repliedByUserId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
  });

  it('retorna média e lista de avaliações', async () => {
    const result = await useCase.run(ReviewTargetType.TENANT, 'tenant-1');
    expect(result.averageRating).toBe(4.5);
    expect(result.totalReviews).toBe(2);
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].reviewerName).toBe('Ana');
  });
});
