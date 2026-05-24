import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { DeleteReviewUseCase } from 'src/modules/review/use-cases/delete-review.use-case';
import { REVIEW_REPOSITORY } from 'src/modules/review/interfaces/review-repository.interface';
import { FindOptionalMembershipByTenantAndUserUseCase } from 'src/modules/tenant-user/use-cases/find-optional-membership-by-tenant-and-user.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('DeleteReviewUseCase', () => {
  let useCase: DeleteReviewUseCase;
  const reviewRepo = { findByIdAndTarget: jest.fn(), softDelete: jest.fn() };
  const findOptionalMembership = { run: jest.fn() };
  const profRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteReviewUseCase,
        { provide: REVIEW_REPOSITORY, useValue: reviewRepo },
        {
          provide: FindOptionalMembershipByTenantAndUserUseCase,
          useValue: findOptionalMembership,
        },
        { provide: PROFESSIONAL_PROFILE_REPOSITORY, useValue: profRepo },
      ],
    }).compile();
    useCase = module.get(DeleteReviewUseCase);
    reviewRepo.findByIdAndTarget.mockResolvedValue({
      id: 'review-1',
      reviewerUserId: 'author-1',
    });
    reviewRepo.softDelete.mockResolvedValue(undefined);
    findOptionalMembership.run.mockResolvedValue(null);
  });

  it('autor pode deletar', async () => {
    await useCase.run(
      'review-1',
      'author-1',
      ReviewTargetType.TENANT,
      'tenant-1',
    );
    expect(reviewRepo.softDelete).toHaveBeenCalledWith('review-1');
  });

  it('OWNER pode deletar avaliação do tenant', async () => {
    findOptionalMembership.run.mockResolvedValue({
      role: TenantUserRole.OWNER,
    });
    await useCase.run(
      'review-1',
      'owner-1',
      ReviewTargetType.TENANT,
      'tenant-1',
    );
    expect(reviewRepo.softDelete).toHaveBeenCalled();
  });

  it('nega delete sem permissão', async () => {
    await expect(
      useCase.run('review-1', 'stranger', ReviewTargetType.TENANT, 'tenant-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
