import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';

describe('TenantService', () => {
  let service: TenantService;
  let repo: jest.Mocked<TenantRepository>;

  const mockTenant: TenantEntity = {
    id: 'uuid-123',
    slug: 'barbearia-do-vitinho',
    name: 'Barbearia do Vitinho',
    status: TenantStatus.ACTIVE,
    timezone: 'America/Sao_Paulo',
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
      existsBySlug: jest.fn(),
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
    it('deve lançar ConflictException quando o slug já existe (incl. soft-deleted)', async () => {
      repo.existsBySlug.mockResolvedValue(true);

      await expect(
        service.create({
          name: 'Outra Barbearia',
          slug: 'barbearia-do-vitinho',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repo.existsBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve criar o tenant quando o slug está disponível', async () => {
      repo.existsBySlug.mockResolvedValue(false);
      repo.create.mockResolvedValue(mockTenant);

      const result = await service.create({
        name: 'Barbearia do Vitinho',
        slug: 'barbearia-do-vitinho',
      });

      expect(repo.existsBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(repo.create).toHaveBeenCalledWith({
        name: 'Barbearia do Vitinho',
        slug: 'barbearia-do-vitinho',
      });
      expect(result).toEqual(mockTenant);
    });

    it('deve normalizar slug a partir do nome quando slug não é informado', async () => {
      repo.existsBySlug.mockResolvedValue(false);
      repo.create.mockResolvedValue({
        ...mockTenant,
        slug: 'barbearia-do-vitinho',
      });

      await service.create({ name: 'Barbearia do Vitinho!!!' });

      expect(repo.existsBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Barbearia do Vitinho!!!',
          slug: 'barbearia-do-vitinho',
        }),
      );
    });

    it('deve lançar BadRequestException quando não é possível gerar slug válido', async () => {
      await expect(service.create({ name: '!!' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('validateSlug', () => {
    it('deve retornar { available: false } quando o slug existe', async () => {
      repo.existsBySlug.mockResolvedValue(true);

      const result = await service.validateSlug({
        slug: 'barbearia-do-vitinho',
      });

      expect(repo.existsBySlug).toHaveBeenCalledWith('barbearia-do-vitinho');
      expect(result).toEqual({ available: false });
    });

    it('deve retornar { available: true } quando o slug não existe', async () => {
      repo.existsBySlug.mockResolvedValue(false);

      const result = await service.validateSlug({ slug: 'slug-disponivel' });

      expect(repo.existsBySlug).toHaveBeenCalledWith('slug-disponivel');
      expect(result).toEqual({ available: true });
    });

    it('deve retornar { available: false, reason: "invalid_format" } para slug inválido', async () => {
      const result = await service.validateSlug({ slug: 'ab' });

      expect(repo.existsBySlug).not.toHaveBeenCalled();
      expect(result).toEqual({ available: false, reason: 'invalid_format' });
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

    it('deve atualizar name e status (slug é imutável)', async () => {
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
