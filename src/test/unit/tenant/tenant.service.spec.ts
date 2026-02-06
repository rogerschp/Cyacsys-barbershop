import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';

describe('TenantService', () => {
  let service: TenantService;
  let repo: jest.Mocked<TenantRepository>;

  const mockTenant: TenantEntity = {
    id: 'uuid-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    createdAt: new Date('2021-01-01'),
    updatedAt: new Date('2021-01-01'),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    const mockRepository = {
      findBySlug: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
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
    repo = module.get(TenantRepository) as jest.Mocked<TenantRepository>;
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findBySlug', () => {
    it('deve retornar o tenant quando o slug existe', async () => {
      repo.findBySlug.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('barbearia-do-vitinho');

      expect(repo.findBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(result).toEqual(mockTenant);
    });

    it('deve retornar null quando o slug não existe', async () => {
      repo.findBySlug.mockResolvedValue(null);

      const result = await service.findBySlug('slug-inexistente');

      expect(repo.findBySlug).toHaveBeenCalledWith('slug-inexistente');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve lançar BadRequestException quando o slug já existe', async () => {
      repo.findBySlug.mockResolvedValue(mockTenant);

      await expect(
        service.create({
          name: 'Outra Barbearia',
          slug: 'barbearia-do-vitinho',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repo.findBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve criar o tenant quando o slug está disponível', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockTenant);

      const result = await service.create({
        name: 'Barbearia do Vitinho',
        slug: 'barbearia-do-vitinho',
      });

      expect(repo.findBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(repo.create).toHaveBeenCalledWith({
        name: 'Barbearia do Vitinho',
        slug: 'barbearia-do-vitinho',
      });
      expect(result).toEqual(mockTenant);
    });
  });

  describe('validateSlug', () => {
    it('deve retornar { available: false } quando o slug existe', async () => {
      repo.findBySlug.mockResolvedValue(mockTenant);

      const result = await service.validateSlug({
        slug: 'barbearia-do-vitinho',
      });

      expect(repo.findBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(result).toEqual({ available: false });
    });

    it('deve retornar { available: true } quando o slug não existe', async () => {
      repo.findBySlug.mockResolvedValue(null);

      const result = await service.validateSlug({ slug: 'slug-disponivel' });

      expect(repo.findBySlug).toHaveBeenCalledWith('slug-disponivel');
      expect(result).toEqual({ available: true });
    });
  });

  describe('findById', () => {
    it('deve retornar o tenant quando o id existe', async () => {
      repo.findById.mockResolvedValue(mockTenant);

      const result = await service.findById('uuid-123');

      expect(repo.findById).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(mockTenant);
    });

    it('deve lançar NotFoundException quando o id não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );

      expect(repo.findById).toHaveBeenCalledWith('id-inexistente');
    });
  });

  describe('update', () => {
    it('deve lançar NotFoundException quando o tenant não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('id-inexistente', { name: 'Novo Nome' }),
      ).rejects.toThrow(NotFoundException);

      expect(repo.findById).toHaveBeenCalledWith('id-inexistente');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando o novo slug já está em uso', async () => {
      repo.findById.mockResolvedValue(mockTenant);
      repo.findBySlug.mockResolvedValue({
        ...mockTenant,
        id: 'outro-id',
        slug: 'outro-slug',
      });

      await expect(
        service.update('uuid-123', { slug: 'outro-slug' }),
      ).rejects.toThrow(BadRequestException);

      expect(repo.findBySlug).toHaveBeenCalledWith('outro-slug');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('deve atualizar quando o slug não muda', async () => {
      const updated = { ...mockTenant, name: 'Nome Atualizado' };
      repo.findById.mockResolvedValue(mockTenant);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('uuid-123', {
        name: 'Nome Atualizado',
      });

      expect(repo.findById).toHaveBeenCalledWith('uuid-123');
      expect(repo.update).toHaveBeenCalledWith('uuid-123', {
        name: 'Nome Atualizado',
      });
      expect(result).toEqual(updated);
    });

    it('deve atualizar quando o novo slug está disponível', async () => {
      const updated = { ...mockTenant, slug: 'novo-slug' };
      repo.findById.mockResolvedValue(mockTenant);
      repo.findBySlug.mockResolvedValue(null);
      repo.update.mockResolvedValue(updated);

      const result = await service.update('uuid-123', { slug: 'novo-slug' });

      expect(repo.findBySlug).toHaveBeenCalledWith('novo-slug');
      expect(repo.update).toHaveBeenCalledWith('uuid-123', {
        slug: 'novo-slug',
      });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('deve lançar NotFoundException quando o tenant não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );

      expect(repo.findById).toHaveBeenCalledWith('id-inexistente');
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('deve fazer soft delete quando o tenant existe', async () => {
      repo.findById.mockResolvedValue(mockTenant);
      repo.softDelete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove('uuid-123');

      expect(repo.findById).toHaveBeenCalledWith('uuid-123');
      expect(repo.softDelete).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual({ affected: 1 });
    });
  });
});
