import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { UpsertReviewUseCase } from 'src/modules/review/use-cases/create-review.use-case';
import { REVIEW_REPOSITORY } from 'src/modules/review/interfaces/review-repository.interface';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { FindOptionalMembershipByTenantAndUserUseCase } from 'src/modules/tenant-user/use-cases/find-optional-membership-by-tenant-and-user.use-case';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { AssertTenantPlanFeatureUseCase } from 'src/modules/subscription/use-cases/assert-tenant-plan-feature.use-case';
import { TENANT_PROFESSIONAL_REPOSITORY } from 'src/modules/tenant-professional/interfaces/tenant-professional-repository.interface';
import { BOOKING_REPOSITORY } from 'src/modules/booking/interfaces/booking-repository.interface';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';

describe('UpsertReviewUseCase', () => {
  let useCase: UpsertReviewUseCase;
  const reviewRepo = {
    findActiveByReviewerAndTarget: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };
  const findTenantById = { run: jest.fn() };
  const profRepo = { findById: jest.fn() };
  const findOptionalMembership = { run: jest.fn() };
  const assertTenantPlanFeature = { run: jest.fn() };
  const tenantProfessionalRepo = {
    listActiveTenantIdsByProfessionalProfileId: jest.fn(),
  };
  const bookingRepo = {
    existsCompletedForReviewer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsertReviewUseCase,
        { provide: REVIEW_REPOSITORY, useValue: reviewRepo },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
        { provide: PROFESSIONAL_PROFILE_REPOSITORY, useValue: profRepo },
        {
          provide: FindOptionalMembershipByTenantAndUserUseCase,
          useValue: findOptionalMembership,
        },
        {
          provide: AssertTenantPlanFeatureUseCase,
          useValue: assertTenantPlanFeature,
        },
        {
          provide: TENANT_PROFESSIONAL_REPOSITORY,
          useValue: tenantProfessionalRepo,
        },
        { provide: BOOKING_REPOSITORY, useValue: bookingRepo },
      ],
    }).compile();
    useCase = module.get(UpsertReviewUseCase);
    jest.clearAllMocks();
    findTenantById.run.mockResolvedValue({ id: 'tenant-1' });
    findOptionalMembership.run.mockResolvedValue(null);
    assertTenantPlanFeature.run.mockResolvedValue(undefined);
    tenantProfessionalRepo.listActiveTenantIdsByProfessionalProfileId.mockResolvedValue(
      [],
    );
    bookingRepo.existsCompletedForReviewer.mockResolvedValue(true);
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
    reviewRepo.update.mockResolvedValue({
      id: 'review-1',
      rating: 4,
      comment: 'Atualizado',
      reviewerUserId: 'user-1',
    });
  });

  it('cria avaliação de tenant (201 path)', async () => {
    const result = await useCase.run(
      'user-1',
      ReviewTargetType.TENANT,
      'tenant-1',
      {
        rating: 5,
        comment: 'Ótimo',
      },
    );
    expect(result.created).toBe(true);
    expect(result.review.id).toBe('review-1');
    expect(reviewRepo.create).toHaveBeenCalled();
  });

  it('atualiza avaliação existente (UPSERT)', async () => {
    reviewRepo.findActiveByReviewerAndTarget.mockResolvedValue({
      id: 'review-1',
      rating: 3,
      comment: 'ok',
    });
    const result = await useCase.run(
      'user-1',
      ReviewTargetType.TENANT,
      'tenant-1',
      { rating: 4, comment: 'Atualizado' },
    );
    expect(result.created).toBe(false);
    expect(reviewRepo.update).toHaveBeenCalledWith(
      'review-1',
      expect.objectContaining({ rating: 4, comment: 'Atualizado' }),
    );
    expect(reviewRepo.create).not.toHaveBeenCalled();
  });

  it('exige booking COMPLETED', async () => {
    bookingRepo.existsCompletedForReviewer.mockResolvedValue(false);
    await expect(
      useCase.run('user-1', ReviewTargetType.TENANT, 'tenant-1', { rating: 5 }),
    ).rejects.toBeInstanceOf(TenantForbiddenException);
  });

  it('valida feature reviews do plano para tenant', async () => {
    await useCase.run('user-1', ReviewTargetType.TENANT, 'tenant-1', {
      rating: 5,
    });
    expect(assertTenantPlanFeature.run).toHaveBeenCalled();
  });

  it('lança PLAN_FEATURE_NOT_AVAILABLE quando plano não inclui reviews', async () => {
    assertTenantPlanFeature.run.mockRejectedValue(
      new TenantForbiddenException(
        'PLAN_FEATURE_NOT_AVAILABLE',
        "Feature 'reviews' não disponível no plano atual.",
      ),
    );
    await expect(
      useCase.run('user-1', ReviewTargetType.TENANT, 'tenant-1', { rating: 5 }),
    ).rejects.toBeInstanceOf(TenantForbiddenException);
  });

  it('lança CANNOT_REVIEW_YOURSELF para OWNER do tenant', async () => {
    findOptionalMembership.run.mockResolvedValue({
      role: TenantUserRole.OWNER,
    });
    await expect(
      useCase.run('user-1', ReviewTargetType.TENANT, 'tenant-1', { rating: 5 }),
    ).rejects.toMatchObject({ response: { code: 'CANNOT_REVIEW_YOURSELF' } });
  });

  it('lança CANNOT_REVIEW_YOURSELF para autoavaliação profissional', async () => {
    profRepo.findById.mockResolvedValue({ id: 'pp-1', userId: 'user-1' });
    tenantProfessionalRepo.listActiveTenantIdsByProfessionalProfileId.mockResolvedValue(
      ['tenant-1'],
    );
    await expect(
      useCase.run('user-1', ReviewTargetType.PROFESSIONAL, 'pp-1', {
        rating: 5,
      }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });
});
