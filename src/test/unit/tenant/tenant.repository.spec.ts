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
    deletedAt: undefined,
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
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
});
