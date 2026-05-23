import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { CreateReviewUseCase } from 'src/modules/review/use-cases/create-review.use-case';
import { REVIEW_REPOSITORY } from 'src/modules/review/interfaces/review-repository.interface';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { TENANT_USER_REPOSITORY } from 'src/modules/tenant-user/interfaces/tenant-user-repository.interface';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('CreateReviewUseCase', () => {
  let useCase: CreateReviewUseCase;
  const reviewRepo = {
    findActiveByReviewerAndTarget: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };
  const findTenantById = { run: jest.fn() };
  const profRepo = { findById: jest.fn() };
  const tenantUserRepo = { findByTenantAndUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReviewUseCase,
        { provide: REVIEW_REPOSITORY, useValue: reviewRepo },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
        { provide: PROFESSIONAL_PROFILE_REPOSITORY, useValue: profRepo },
        { provide: TENANT_USER_REPOSITORY, useValue: tenantUserRepo },
      ],
    }).compile();
    useCase = module.get(CreateReviewUseCase);
    jest.clearAllMocks();
    findTenantById.run.mockResolvedValue({ id: 'tenant-1' });
    tenantUserRepo.findByTenantAndUser.mockResolvedValue(null);
    reviewRepo.findActiveByReviewerAndTarget.mockResolvedValue(null);
    reviewRepo.create.mockResolvedValue({
      id: 'review-1',
      rating: 5,
      reviewerUserId: 'user-1',
    });
    reviewRepo.findById.mockResolvedValue({
      id: 'review-1',
      rating: 5,
      reviewerUserId: 'user-1',
      reviewer: { name: 'Maria' },
    });
  });

  it('cria avaliação de tenant', async () => {
    const result = await useCase.run('user-1', ReviewTargetType.TENANT, 'tenant-1', {
      rating: 5,
      comment: 'Ótimo',
    });
    expect(result.id).toBe('review-1');
    expect(reviewRepo.create).toHaveBeenCalled();
  });

  it('lança REVIEW_ALREADY_EXISTS quando já existe avaliação', async () => {
    reviewRepo.findActiveByReviewerAndTarget.mockResolvedValue({ id: 'old' });
    await expect(
      useCase.run('user-1', ReviewTargetType.TENANT, 'tenant-1', { rating: 4 }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('lança CANNOT_REVIEW_YOURSELF para OWNER do tenant', async () => {
    tenantUserRepo.findByTenantAndUser.mockResolvedValue({
      role: TenantUserRole.OWNER,
    });
    await expect(
      useCase.run('user-1', ReviewTargetType.TENANT, 'tenant-1', { rating: 5 }),
    ).rejects.toMatchObject({ response: { code: 'CANNOT_REVIEW_YOURSELF' } });
  });
});
