import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import {
  MyProfessionalReviewController,
  ProfessionalReviewByUserController,
} from 'src/modules/review/controllers/professional-review.controller';
import { CreateReviewUseCase } from 'src/modules/review/use-cases/create-review.use-case';
import { ListReviewsUseCase } from 'src/modules/review/use-cases/list-reviews.use-case';
import { EditReviewUseCase } from 'src/modules/review/use-cases/edit-review.use-case';
import { ReplyReviewUseCase } from 'src/modules/review/use-cases/reply-review.use-case';
import { DeleteReviewUseCase } from 'src/modules/review/use-cases/delete-review.use-case';
import { GetProfessionalProfileByUserUseCase } from 'src/modules/professional-profile/use-cases/get-professional-profile-by-user.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';

const mockReviewEntity = {
  id: 'r1',
  reviewerUserId: 'user-2',
  reviewer: { name: 'Maria' },
  targetType: ReviewTargetType.PROFESSIONAL,
  targetId: 'profile-1',
  rating: 5,
  comment: null,
  isEdited: false,
  editedAt: null,
  reply: null,
  repliedAt: null,
  repliedByUserId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProfessionalReview controllers (HTTP)', () => {
  let publicApp: INestApplication;
  let meApp: INestApplication;

  const createReview = { run: jest.fn() };
  const listReviews = { run: jest.fn() };
  const editReview = { run: jest.fn() };
  const replyReview = { run: jest.fn() };
  const deleteReview = { run: jest.fn() };
  const getProfile = { run: jest.fn() };

  const bearerGuard = {
    canActivate: (ctx: {
      switchToHttp: () => { getRequest: () => object };
    }) => {
      const req = ctx.switchToHttp().getRequest() as {
        user?: { dbUser: { id: string } };
      };
      req.user = { dbUser: { id: 'user-me' } };
      return true;
    },
  };

  beforeAll(async () => {
    const publicModule = await Test.createTestingModule({
      controllers: [ProfessionalReviewByUserController],
      providers: [
        { provide: CreateReviewUseCase, useValue: createReview },
        { provide: ListReviewsUseCase, useValue: listReviews },
        {
          provide: GetProfessionalProfileByUserUseCase,
          useValue: getProfile,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue(bearerGuard)
      .compile();

    publicApp = publicModule.createNestApplication();
    await publicApp.init();

    const meModule = await Test.createTestingModule({
      controllers: [MyProfessionalReviewController],
      providers: [
        { provide: EditReviewUseCase, useValue: editReview },
        { provide: ReplyReviewUseCase, useValue: replyReview },
        { provide: DeleteReviewUseCase, useValue: deleteReview },
        {
          provide: GetProfessionalProfileByUserUseCase,
          useValue: getProfile,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue(bearerGuard)
      .compile();

    meApp = meModule.createNestApplication();
    await meApp.init();

    getProfile.run.mockResolvedValue({ id: 'profile-1', userId: 'user-pro' });
  });

  afterAll(async () => {
    await publicApp.close();
    await meApp.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getProfile.run.mockResolvedValue({ id: 'profile-1', userId: 'user-pro' });
  });

  it('GET /users/:userId/professional-profile/reviews é público', () => {
    listReviews.run.mockResolvedValue({
      averageRating: 4,
      totalReviews: 2,
      reviews: [],
    });
    return request(publicApp.getHttpServer())
      .get('/users/user-pro/professional-profile/reviews')
      .expect(200)
      .expect((res) => {
        expect(res.body.totalReviews).toBe(2);
        expect(listReviews.run).toHaveBeenCalledWith(
          ReviewTargetType.PROFESSIONAL,
          'profile-1',
        );
      });
  });

  it('POST /users/:userId/professional-profile/reviews cria avaliação', () => {
    createReview.run.mockResolvedValue(mockReviewEntity);
    return request(publicApp.getHttpServer())
      .post('/users/user-pro/professional-profile/reviews')
      .send({ rating: 5 })
      .expect(201)
      .expect(() => {
        expect(createReview.run).toHaveBeenCalledWith(
          'user-me',
          ReviewTargetType.PROFESSIONAL,
          'profile-1',
          { rating: 5 },
        );
      });
  });

  it('PATCH /users/me/professional-profile/reviews/:id edita avaliação', () => {
    editReview.run.mockResolvedValue({ ...mockReviewEntity, rating: 4 });
    return request(meApp.getHttpServer())
      .patch('/users/me/professional-profile/reviews/r1')
      .send({ rating: 4 })
      .expect(200)
      .expect(() => {
        expect(editReview.run).toHaveBeenCalledWith(
          'r1',
          'user-me',
          ReviewTargetType.PROFESSIONAL,
          'profile-1',
          { rating: 4 },
        );
      });
  });

  it('PATCH /users/me/professional-profile/reviews/:id/reply responde', () => {
    replyReview.run.mockResolvedValue({
      ...mockReviewEntity,
      reply: 'Obrigado',
    });
    return request(meApp.getHttpServer())
      .patch('/users/me/professional-profile/reviews/r1/reply')
      .send({ reply: 'Obrigado' })
      .expect(200);
  });

  it('POST sem usuário no request usa string vazia', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProfessionalReviewByUserController],
      providers: [
        { provide: CreateReviewUseCase, useValue: createReview },
        { provide: ListReviewsUseCase, useValue: listReviews },
        {
          provide: GetProfessionalProfileByUserUseCase,
          useValue: getProfile,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const isolatedApp = moduleRef.createNestApplication();
    await isolatedApp.init();
    createReview.run.mockResolvedValue(mockReviewEntity);
    await request(isolatedApp.getHttpServer())
      .post('/users/user-pro/professional-profile/reviews')
      .send({ rating: 5 })
      .expect(201);
    expect(createReview.run).toHaveBeenCalledWith(
      '',
      ReviewTargetType.PROFESSIONAL,
      'profile-1',
      { rating: 5 },
    );
    await isolatedApp.close();
  });

  it('DELETE /users/me/professional-profile/reviews/:id remove', () => {
    deleteReview.run.mockResolvedValue(undefined);
    return request(meApp.getHttpServer())
      .delete('/users/me/professional-profile/reviews/r1')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('Review deleted successfully');
        expect(deleteReview.run).toHaveBeenCalledWith(
          'r1',
          'user-me',
          ReviewTargetType.PROFESSIONAL,
          'profile-1',
        );
      });
  });

  it('PATCH me sem usuário no request usa string vazia', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MyProfessionalReviewController],
      providers: [
        { provide: EditReviewUseCase, useValue: editReview },
        { provide: ReplyReviewUseCase, useValue: replyReview },
        { provide: DeleteReviewUseCase, useValue: deleteReview },
        {
          provide: GetProfessionalProfileByUserUseCase,
          useValue: getProfile,
        },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const isolatedApp = moduleRef.createNestApplication();
    await isolatedApp.init();
    editReview.run.mockResolvedValue(mockReviewEntity);
    await request(isolatedApp.getHttpServer())
      .patch('/users/me/professional-profile/reviews/r1')
      .send({ rating: 3 })
      .expect(200);
    expect(editReview.run).toHaveBeenCalledWith(
      'r1',
      '',
      ReviewTargetType.PROFESSIONAL,
      'profile-1',
      { rating: 3 },
    );
    await isolatedApp.close();
  });
});
