import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';

describe('TenantRepository', () => {
  let repository: TenantRepository;
  let typeOrmRepo: jest.Mocked<Repository<TenantEntity>>;

  const mockTenant: TenantEntity = {
    id: 'uuid-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
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
    it('deve criar e salvar o tenant', async () => {
      const dto = {
        name: 'Barbearia do Vitinho',
        slug: 'barbearia-do-vitinho',
      };
      typeOrmRepo.create.mockReturnValue(mockTenant as any);
      typeOrmRepo.save.mockResolvedValue(mockTenant);

      const result = await repository.create(dto);

      expect(typeOrmRepo.create).toHaveBeenCalledWith(dto);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(mockTenant);
      expect(result).toEqual(mockTenant);
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
