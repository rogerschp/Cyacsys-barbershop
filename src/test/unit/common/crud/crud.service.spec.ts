import { CrudService } from 'src/common/crud/crud.service';
import { ICrudRepository } from 'src/common/interfaces/crud-repository.interface';
import { PaginatedOptionsDto } from 'src/common/dto/paginated-options.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

interface MockEntity {
  id: string;
  tenantId: string;
  name: string;
}

describe('CrudService', () => {
  let service: CrudService<
    MockEntity,
    ICrudRepository<MockEntity, { name: string }, { name?: string }>,
    { name: string },
    { name?: string }
  >;
  let repository: jest.Mocked<
    ICrudRepository<MockEntity, { name: string }, { name?: string }>
  >;

  const mockEntity: MockEntity = {
    id: 'entity-1',
    tenantId: 'tenant-1',
    name: 'Test Entity',
  };

  const mockPaginatedResponse: PaginatedResponseDto<MockEntity> = {
    data: [mockEntity],
    total: 1,
    first: 0,
    rows: 10,
    page: 1,
    pageCount: 1,
  };

  beforeEach(() => {
    repository = {
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new CrudService(repository);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findPaginated', () => {
    it('deve delegar ao repository e retornar resposta paginada', async () => {
      const options: PaginatedOptionsDto = { first: 0, rows: 10 };
      repository.findPaginated.mockResolvedValue(mockPaginatedResponse);

      const result = await service.findPaginated(options, 'tenant-1');

      expect(repository.findPaginated).toHaveBeenCalledWith(
        options,
        'tenant-1',
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('deve delegar ao repository e retornar a entidade', async () => {
      repository.findOne.mockResolvedValue(mockEntity);

      const result = await service.findOne('entity-1', 'tenant-1');

      expect(repository.findOne).toHaveBeenCalledWith('entity-1', 'tenant-1');
      expect(result).toEqual(mockEntity);
    });
  });

  describe('create', () => {
    it('deve delegar ao repository e retornar a entidade criada', async () => {
      repository.create.mockResolvedValue(mockEntity);

      const result = await service.create({ name: 'Test Entity' }, 'tenant-1');

      expect(repository.create).toHaveBeenCalledWith(
        { name: 'Test Entity' },
        'tenant-1',
      );
      expect(result).toEqual(mockEntity);
    });
  });

  describe('update', () => {
    it('deve delegar ao repository e retornar a entidade atualizada', async () => {
      const updated = { ...mockEntity, name: 'Updated' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update(
        'entity-1',
        { name: 'Updated' },
        'tenant-1',
      );

      expect(repository.update).toHaveBeenCalledWith(
        'entity-1',
        { name: 'Updated' },
        'tenant-1',
      );
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deve delegar ao repository e retornar a entidade removida', async () => {
      repository.delete.mockResolvedValue(mockEntity);

      const result = await service.delete('entity-1', 'tenant-1');

      expect(repository.delete).toHaveBeenCalledWith('entity-1', 'tenant-1');
      expect(result).toEqual(mockEntity);
    });
  });
});
