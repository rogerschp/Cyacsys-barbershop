import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewRepository } from 'src/repository/review/review.repository';
import { ReviewEntity } from 'src/modules/review/entities/review.entity';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';

describe('ReviewRepository', () => {
  let repository: ReviewRepository;
  let typeOrmRepo: jest.Mocked<Repository<ReviewEntity>>;

  const mockReview = {
    id: 'review-1',
    reviewerUserId: 'user-1',
    targetType: ReviewTargetType.TENANT,
    targetId: 'tenant-1',
    rating: 5,
    comment: 'Ótimo',
    isEdited: false,
    editedAt: null,
    reply: null,
    repliedAt: null,
    repliedByUserId: null,
    reviewer: { name: 'Maria' },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ReviewEntity;

  const listQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockReview]),
  };

  const statsQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ average: '4.5', total: '2' }),
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(listQb)
        .mockReturnValueOnce(statsQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewRepository,
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(ReviewRepository);
    typeOrmRepo = module.get(getRepositoryToken(ReviewEntity));
  });

  it('create persiste avaliação', async () => {
    typeOrmRepo.create.mockReturnValue(mockReview);
    typeOrmRepo.save.mockResolvedValue(mockReview);
    const result = await repository.create({
      reviewerUserId: 'user-1',
      targetType: ReviewTargetType.TENANT,
      targetId: 'tenant-1',
      rating: 5,
      comment: 'Ótimo',
    });
    expect(result).toEqual(mockReview);
  });

  it('listByTarget calcula média zero quando average é null', async () => {
    const listQbWithReviews = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockReview]),
    };
    const nullAverageStatsQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ average: null, total: '1' }),
    };
    typeOrmRepo.createQueryBuilder
      .mockReset()
      .mockReturnValueOnce(listQbWithReviews as never)
      .mockReturnValueOnce(nullAverageStatsQb as never);

    const result = await repository.listByTarget(
      ReviewTargetType.TENANT,
      'tenant-1',
    );
    expect(result.totalReviews).toBe(1);
    expect(result.averageRating).toBe(0);
  });

  it('listByTarget retorna média e reviews', async () => {
    const result = await repository.listByTarget(
      ReviewTargetType.TENANT,
      'tenant-1',
    );
    expect(result.totalReviews).toBe(2);
    expect(result.averageRating).toBe(4.5);
    expect(result.reviews).toHaveLength(1);
  });

  it('listByTarget trata stats ausente', async () => {
    const listOnlyQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const noStatsQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(undefined),
    };
    typeOrmRepo.createQueryBuilder
      .mockReset()
      .mockReturnValueOnce(listOnlyQb as never)
      .mockReturnValueOnce(noStatsQb as never);

    const result = await repository.listByTarget(
      ReviewTargetType.PROFESSIONAL,
      'profile-1',
    );
    expect(result.totalReviews).toBe(0);
    expect(result.averageRating).toBe(0);
  });

  it('listByTarget retorna zero quando sem avaliações', async () => {
    const emptyListQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const emptyStatsQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ average: null, total: '0' }),
    };
    typeOrmRepo.createQueryBuilder
      .mockReset()
      .mockReturnValueOnce(emptyListQb as never)
      .mockReturnValueOnce(emptyStatsQb as never);

    const result = await repository.listByTarget(
      ReviewTargetType.TENANT,
      'tenant-1',
    );
    expect(result.totalReviews).toBe(0);
    expect(result.averageRating).toBe(0);
    expect(result.reviews).toHaveLength(0);
  });

  it('findById retorna entidade', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockReview);
    const result = await repository.findById('review-1');
    expect(result).toEqual(mockReview);
  });

  it('findByIdAndTarget filtra por target', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockReview);
    const result = await repository.findByIdAndTarget(
      'review-1',
      ReviewTargetType.TENANT,
      'tenant-1',
    );
    expect(result).toEqual(mockReview);
    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: {
        id: 'review-1',
        targetType: ReviewTargetType.TENANT,
        targetId: 'tenant-1',
      },
      relations: ['reviewer', 'repliedBy'],
    });
  });

  it('findActiveByReviewerAndTarget retorna avaliação ativa', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockReview);
    const result = await repository.findActiveByReviewerAndTarget(
      'user-1',
      ReviewTargetType.TENANT,
      'tenant-1',
    );
    expect(result).toEqual(mockReview);
  });

  it('update persiste e retorna entidade', async () => {
    typeOrmRepo.update.mockResolvedValue({ affected: 1 } as never);
    typeOrmRepo.findOne.mockResolvedValue({
      ...mockReview,
      rating: 4,
    });
    const result = await repository.update('review-1', { rating: 4 });
    expect(result.rating).toBe(4);
  });

  it('update lança quando entidade não encontrada', async () => {
    typeOrmRepo.update.mockResolvedValue({ affected: 1 } as never);
    typeOrmRepo.findOne.mockResolvedValue(null);
    await expect(repository.update('review-1', { rating: 4 })).rejects.toThrow(
      'Review not found after update',
    );
  });

  it('softDelete remove logicamente', async () => {
    typeOrmRepo.softDelete.mockResolvedValue({ affected: 1 } as never);
    await repository.softDelete('review-1');
    expect(typeOrmRepo.softDelete).toHaveBeenCalledWith('review-1');
  });
});
