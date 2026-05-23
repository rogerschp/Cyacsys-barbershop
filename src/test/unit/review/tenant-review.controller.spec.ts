import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { TenantReviewController } from 'src/modules/review/controllers/tenant-review.controller';
import { CreateReviewUseCase } from 'src/modules/review/use-cases/create-review.use-case';
import { ListReviewsUseCase } from 'src/modules/review/use-cases/list-reviews.use-case';
import { EditReviewUseCase } from 'src/modules/review/use-cases/edit-review.use-case';
import { ReplyReviewUseCase } from 'src/modules/review/use-cases/reply-review.use-case';
import { DeleteReviewUseCase } from 'src/modules/review/use-cases/delete-review.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';

describe('TenantReviewController (HTTP)', () => {
  let app: INestApplication;
  const createReview = { run: jest.fn() };
  const listReviews = { run: jest.fn() };
  const editReview = { run: jest.fn() };
  const replyReview = { run: jest.fn() };
  const deleteReview = { run: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantReviewController],
      providers: [
        { provide: CreateReviewUseCase, useValue: createReview },
        { provide: ListReviewsUseCase, useValue: listReviews },
        { provide: EditReviewUseCase, useValue: editReview },
        { provide: ReplyReviewUseCase, useValue: replyReview },
        { provide: DeleteReviewUseCase, useValue: deleteReview },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (ctx: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          const req = ctx.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string } };
          };
          req.user = { dbUser: { id: 'user-1' } };
          return true;
        },
      })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tenants/:tenantId/reviews é público', () => {
    listReviews.run.mockResolvedValue({
      averageRating: 5,
      totalReviews: 1,
      reviews: [],
    });
    return request(app.getHttpServer())
      .get('/tenants/tenant-1/reviews')
      .expect(200)
      .expect((res) => {
        expect(res.body.totalReviews).toBe(1);
        expect(listReviews.run).toHaveBeenCalledWith(
          ReviewTargetType.TENANT,
          'tenant-1',
        );
      });
  });

  it('POST /tenants/:tenantId/reviews cria avaliação', () => {
    createReview.run.mockResolvedValue({
      id: 'r1',
      reviewerUserId: 'user-1',
      reviewer: { name: 'Maria' },
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
    });
    return request(app.getHttpServer())
      .post('/tenants/tenant-1/reviews')
      .send({ rating: 5 })
      .expect(201);
  });

  it('PATCH /tenants/:tenantId/reviews/:id edita avaliação', () => {
    editReview.run.mockResolvedValue({
      id: 'r1',
      reviewerUserId: 'user-1',
      reviewer: { name: 'Maria' },
      targetType: ReviewTargetType.TENANT,
      targetId: 'tenant-1',
      rating: 4,
      comment: 'Atualizado',
      isEdited: true,
      editedAt: new Date(),
      reply: null,
      repliedAt: null,
      repliedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return request(app.getHttpServer())
      .patch('/tenants/tenant-1/reviews/r1')
      .send({ rating: 4, comment: 'Atualizado' })
      .expect(200);
  });

  it('PATCH /tenants/:tenantId/reviews/:id/reply responde', () => {
    replyReview.run.mockResolvedValue({
      id: 'r1',
      reviewerUserId: 'user-1',
      reviewer: { name: 'Maria' },
      targetType: ReviewTargetType.TENANT,
      targetId: 'tenant-1',
      rating: 5,
      comment: null,
      isEdited: false,
      editedAt: null,
      reply: 'Obrigado',
      repliedAt: new Date(),
      repliedByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return request(app.getHttpServer())
      .patch('/tenants/tenant-1/reviews/r1/reply')
      .send({ reply: 'Obrigado' })
      .expect(200);
  });

  it('POST sem usuário no request usa string vazia', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantReviewController],
      providers: [
        { provide: CreateReviewUseCase, useValue: createReview },
        { provide: ListReviewsUseCase, useValue: listReviews },
        { provide: EditReviewUseCase, useValue: editReview },
        { provide: ReplyReviewUseCase, useValue: replyReview },
        { provide: DeleteReviewUseCase, useValue: deleteReview },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const isolatedApp = moduleRef.createNestApplication();
    await isolatedApp.init();
    createReview.run.mockResolvedValue({
      id: 'r1',
      reviewerUserId: '',
      reviewer: { name: 'Anon' },
      targetType: ReviewTargetType.TENANT,
      targetId: 'tenant-1',
      rating: 3,
      comment: null,
      isEdited: false,
      editedAt: null,
      reply: null,
      repliedAt: null,
      repliedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await request(isolatedApp.getHttpServer())
      .post('/tenants/tenant-1/reviews')
      .send({ rating: 3 })
      .expect(201);
    expect(createReview.run).toHaveBeenCalledWith(
      '',
      ReviewTargetType.TENANT,
      'tenant-1',
      { rating: 3 },
    );
    await isolatedApp.close();
  });

  it('DELETE /tenants/:tenantId/reviews/:id remove', () => {
    deleteReview.run.mockResolvedValue(undefined);
    return request(app.getHttpServer())
      .delete('/tenants/tenant-1/reviews/r1')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('Review deleted successfully');
      });
  });

  it('PATCH reply sem usuário no request usa string vazia', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantReviewController],
      providers: [
        { provide: CreateReviewUseCase, useValue: createReview },
        { provide: ListReviewsUseCase, useValue: listReviews },
        { provide: EditReviewUseCase, useValue: editReview },
        { provide: ReplyReviewUseCase, useValue: replyReview },
        { provide: DeleteReviewUseCase, useValue: deleteReview },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const isolatedApp = moduleRef.createNestApplication();
    await isolatedApp.init();
    replyReview.run.mockResolvedValue({
      id: 'r1',
      reviewerUserId: 'user-2',
      reviewer: { name: 'Maria' },
      targetType: ReviewTargetType.TENANT,
      targetId: 'tenant-1',
      rating: 5,
      comment: null,
      isEdited: false,
      editedAt: null,
      reply: 'Ok',
      repliedAt: new Date(),
      repliedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await request(isolatedApp.getHttpServer())
      .patch('/tenants/tenant-1/reviews/r1/reply')
      .send({ reply: 'Ok' })
      .expect(200);
    expect(replyReview.run).toHaveBeenCalledWith(
      'r1',
      '',
      ReviewTargetType.TENANT,
      'tenant-1',
      { reply: 'Ok' },
    );
    await isolatedApp.close();
  });
});
