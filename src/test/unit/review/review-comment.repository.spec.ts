import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewCommentRepository } from 'src/repository/review/review-comment.repository';
import { ReviewCommentEntity } from 'src/modules/review/entities/review-comment.entity';

describe('ReviewCommentRepository', () => {
  let repository: ReviewCommentRepository;
  let typeOrmRepo: jest.Mocked<Repository<ReviewCommentEntity>>;

  const mockComment = {
    id: 'c1',
    reviewId: 'r1',
    authorUserId: 'u1',
    body: 'Voltei',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ReviewCommentEntity;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewCommentRepository,
        {
          provide: getRepositoryToken(ReviewCommentEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(ReviewCommentRepository);
    typeOrmRepo = module.get(getRepositoryToken(ReviewCommentEntity));
  });

  it('create persiste comentário', async () => {
    typeOrmRepo.create.mockReturnValue(mockComment);
    typeOrmRepo.save.mockResolvedValue(mockComment);
    const result = await repository.create({
      reviewId: 'r1',
      authorUserId: 'u1',
      body: 'Voltei',
    });
    expect(result).toEqual(mockComment);
    expect(typeOrmRepo.create).toHaveBeenCalledWith({
      reviewId: 'r1',
      authorUserId: 'u1',
      body: 'Voltei',
    });
  });

  it('findById carrega author e review', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockComment);
    const result = await repository.findById('c1');
    expect(result).toEqual(mockComment);
    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'c1' },
      relations: ['author', 'review'],
    });
  });

  it('softDelete remove logicamente', async () => {
    typeOrmRepo.softDelete.mockResolvedValue({ affected: 1 } as never);
    await repository.softDelete('c1');
    expect(typeOrmRepo.softDelete).toHaveBeenCalledWith('c1');
  });
});
