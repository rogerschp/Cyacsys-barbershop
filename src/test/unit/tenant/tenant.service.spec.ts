import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';

describe('TenantService', () => {
  let service: TenantService;
  let repository: jest.Mocked<TenantRepository>;

  const mockTenant: TenantEntity = {
    id: 'uuid-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    createdAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    const mockRepository = {
      findBySlug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: TenantRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    repository = module.get(TenantRepository) as jest.Mocked<TenantRepository>;
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findBySlug', () => {
    it('deve retornar o tenant quando o slug existe', async () => {
      repository.findBySlug.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('barbearia-do-vitinho');

      expect(repository.findBySlug).toHaveBeenCalledWith(
        'barbearia-do-vitinho',
      );
      expect(result).toEqual(mockTenant);
    });

    it('deve retornar null quando o slug não existe', async () => {
      repository.findBySlug.mockResolvedValue(null);

      const result = await service.findBySlug('slug-inexistente');

      expect(repository.findBySlug).toHaveBeenCalledWith('slug-inexistente');
      expect(result).toBeNull();
    });
  });
});
