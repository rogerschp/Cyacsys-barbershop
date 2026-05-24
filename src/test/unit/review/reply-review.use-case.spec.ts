import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ReplyReviewUseCase } from 'src/modules/review/use-cases/reply-review.use-case';
import { REVIEW_REPOSITORY } from 'src/modules/review/interfaces/review-repository.interface';
import { FindOptionalMembershipByTenantAndUserUseCase } from 'src/modules/tenant-user/use-cases/find-optional-membership-by-tenant-and-user.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';

describe('ReplyReviewUseCase', () => {
  let useCase: ReplyReviewUseCase;
  const reviewRepo = { findByIdAndTarget: jest.fn(), update: jest.fn() };
  const findOptionalMembership = { run: jest.fn() };
  const profRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplyReviewUseCase,
        { provide: REVIEW_REPOSITORY, useValue: reviewRepo },
        {
          provide: FindOptionalMembershipByTenantAndUserUseCase,
          useValue: findOptionalMembership,
        },
        { provide: PROFESSIONAL_PROFILE_REPOSITORY, useValue: profRepo },
      ],
    }).compile();
    useCase = module.get(ReplyReviewUseCase);
    reviewRepo.findByIdAndTarget.mockResolvedValue({ id: 'review-1' });
    reviewRepo.update.mockResolvedValue({ id: 'review-1', reply: 'Obrigado' });
  });

  it('OWNER pode responder avaliação do tenant', async () => {
    findOptionalMembership.run.mockResolvedValue({
      role: TenantUserRole.OWNER,
    });
    await useCase.run(
      'review-1',
      'owner-1',
      ReviewTargetType.TENANT,
      'tenant-1',
      { reply: 'Obrigado' },
    );
    expect(reviewRepo.update).toHaveBeenCalled();
  });

  it('profissional dono pode responder', async () => {
    profRepo.findById.mockResolvedValue({ id: 'prof-1', userId: 'pro-1' });
    await useCase.run(
      'review-1',
      'pro-1',
      ReviewTargetType.PROFESSIONAL,
      'prof-1',
      { reply: 'Obrigado' },
    );
    expect(reviewRepo.update).toHaveBeenCalled();
  });

  it('nega resposta sem permissão no tenant', async () => {
    findOptionalMembership.run.mockResolvedValue({
      role: TenantUserRole.STAFF,
    });
    await expect(
      useCase.run('review-1', 'staff-1', ReviewTargetType.TENANT, 'tenant-1', {
        reply: 'x',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
