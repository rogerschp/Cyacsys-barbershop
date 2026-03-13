import { BaseRepository } from 'src/common/crud/crud.repository';
import { PaginatedOptionsDto } from 'src/common/dto/paginated-options.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { Repository } from 'typeorm';

interface MockEntity {
  id: string;
  tenantId: string;
  name: string;
}

class TestBaseRepository extends BaseRepository<
  MockEntity,
  { name: string },
  { name?: string }
> {
  constructor(private readonly repo: Repository<MockEntity>) {
    super();
  }

  protected getTableName(): string {
    return 'test_entities';
  }

  protected getRepository(): Repository<MockEntity> {
    return this.repo;
  }

  async findPaginated(
    options: PaginatedOptionsDto,
  ): Promise<PaginatedResponseDto<MockEntity>> {
    return new PaginatedResponseDto({ data: [], total: 0 }, options);
  }

  async findOne(id: string, tenantId: string): Promise<MockEntity> {
    return (
      (this.repo as any).findOneMock?.(id, tenantId) ??
      Promise.resolve(null as any)
    );
  }
}

describe('BaseRepository', () => {
  let repository: TestBaseRepository;
  let typeOrmRepo: jest.Mocked<Repository<MockEntity>>;

  const mockEntity: MockEntity = {
    id: 'entity-1',
    tenantId: 'tenant-1',
    name: 'Test Entity',
  };

  beforeEach(() => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findOne: jest.fn(),
    };
    (mockRepo as any).findOneMock = jest.fn();
    typeOrmRepo = mockRepo as any;
    repository = new TestBaseRepository(typeOrmRepo);
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('deve criar entidade com tenantId e salvar', async () => {
      typeOrmRepo.create.mockReturnValue(mockEntity as any);
      typeOrmRepo.save.mockResolvedValue(mockEntity as any);

      const result = await repository.create(
        { name: 'Test Entity' },
        'tenant-1',
      );

      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        name: 'Test Entity',
        tenantId: 'tenant-1',
      });
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockEntity);
      expect(result).toEqual(mockEntity);
    });

    it('deve retornar primeiro item quando save retorna array', async () => {
      typeOrmRepo.create.mockReturnValue(mockEntity as any);
      typeOrmRepo.save.mockResolvedValue([mockEntity] as any);

      const result = await repository.create({ name: 'Test' }, 'tenant-1');

      expect(result).toEqual(mockEntity);
    });
  });

  describe('update', () => {
    it('deve chamar findOne, update e findOne novamente', async () => {
      (typeOrmRepo as any).findOneMock = jest
        .fn()
        .mockResolvedValueOnce(mockEntity)
        .mockResolvedValueOnce({ ...mockEntity, name: 'Updated' });
      typeOrmRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.update(
        'entity-1',
        { name: 'Updated' },
        'tenant-1',
      );

      expect((typeOrmRepo as any).findOneMock).toHaveBeenCalledTimes(2);
      expect((typeOrmRepo as any).findOneMock).toHaveBeenCalledWith(
        'entity-1',
        'tenant-1',
      );
      expect(typeOrmRepo.update).toHaveBeenCalledWith(
        { id: 'entity-1', tenantId: 'tenant-1' },
        { name: 'Updated' },
      );
      expect(result).toEqual({ ...mockEntity, name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('deve chamar findOne, softDelete e retornar a entidade', async () => {
      (typeOrmRepo as any).findOneMock = jest
        .fn()
        .mockResolvedValue(mockEntity);
      typeOrmRepo.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.delete('entity-1', 'tenant-1');

      expect((typeOrmRepo as any).findOneMock).toHaveBeenCalledWith(
        'entity-1',
        'tenant-1',
      );
      expect(typeOrmRepo.softDelete).toHaveBeenCalledWith({
        id: 'entity-1',
        tenantId: 'tenant-1',
      });
      expect(result).toEqual(mockEntity);
    });
  });
});
