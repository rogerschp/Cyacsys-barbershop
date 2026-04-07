import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';

describe('TenantRepository', () => {
  let repository: TenantRepository;
  let typeOrmRepo: jest.Mocked<Repository<TenantEntity>>;

  const mockTenant: TenantEntity = {
    id: 'uuid-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    status: TenantStatus.ACTIVE,
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  const mockQueryBuilder = {
    withDeleted: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getExists: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantRepository,
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TenantRepository>(TenantRepository);
    typeOrmRepo = module.get(getRepositoryToken(TenantEntity)) as jest.Mocked<
      Repository<TenantEntity>
    >;
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  describe('findBySlug', () => {
    it('deve retornar o tenant quando o slug existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockTenant);

      const result = await repository.findBySlug('barbearia-do-vitinho');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'barbearia-do-vitinho' },
      });
      expect(result).toEqual(mockTenant);
    });

    it('deve retornar null quando o slug não existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findBySlug('slug-inexistente');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'slug-inexistente' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('deve retornar o tenant quando o id existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(mockTenant);

      const result = await repository.findById('uuid-123');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
      });
      expect(result).toEqual(mockTenant);
    });

    it('deve retornar null quando o id não existe', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('id-inexistente');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'id-inexistente' },
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar e salvar o tenant com status ACTIVE por padrão', async () => {
      const dto = {
        name: 'Barbearia do Vitinho',
        slug: 'barbearia-do-vitinho',
      };
      typeOrmRepo.create.mockReturnValue(mockTenant as any);
      typeOrmRepo.save.mockResolvedValue(mockTenant);

      const result = await repository.create(dto);

      expect(typeOrmRepo.create).toHaveBeenCalledWith({
        ...dto,
        status: TenantStatus.ACTIVE,
      });
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockTenant);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('existsBySlug', () => {
    it('deve usar withDeleted e retornar true quando slug existe', async () => {
      mockQueryBuilder.getExists.mockResolvedValueOnce(true);

      const result = await repository.existsBySlug('barbearia-do-vitinho');

      expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(mockQueryBuilder.withDeleted).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('t.slug = :slug', {
        slug: 'barbearia-do-vitinho',
      });
      expect(result).toBe(true);
    });

    it('deve retornar false quando slug não existe', async () => {
      mockQueryBuilder.getExists.mockResolvedValueOnce(false);

      const result = await repository.existsBySlug('slug-novo');

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('deve salvar o tenant com id e dados parciais', async () => {
      const dto = { name: 'Nome Atualizado' };
      const updated = { ...mockTenant, ...dto };
      typeOrmRepo.save.mockResolvedValue(updated);

      const result = await repository.update('uuid-123', dto);

      expect(typeOrmRepo.save).toHaveBeenCalledWith({
        id: 'uuid-123',
        ...dto,
      });
      expect(result).toEqual(updated);
    });
  });

  describe('softDelete', () => {
    it('deve chamar softDelete do repositório', async () => {
      typeOrmRepo.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.softDelete('uuid-123');

      expect(typeOrmRepo.softDelete).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual({ affected: 1 });
    });
  });
});
