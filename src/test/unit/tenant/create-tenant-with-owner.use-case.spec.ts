import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateTenantWithOwnerUseCase } from 'src/modules/tenant/use-cases/create-tenant-with-owner.use-case';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { AddressRepository } from 'src/repository/address/address.repository';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';
import { CreateFreeSubscriptionUseCase } from 'src/modules/subscription/use-cases/create-free-subscription.use-case';
import { getDataSourceToken } from '@nestjs/typeorm';
describe('CreateTenantWithOwnerUseCase', () => {
  let useCase: CreateTenantWithOwnerUseCase;
  let tenantRepository: jest.Mocked<TenantRepository>;
  let addressRepository: {
    create: jest.Mock;
    softDelete: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };
  const mockTenant: TenantEntity = {
    id: 'tenant-uuid',
    slug: 'barbearia-nova',
    name: 'Barbearia Nova',
    status: TenantStatus.ACTIVE,
    telephone: '5511999999999',
    addressId: null,
    address: null,
    timezone: 'America/Sao_Paulo',
    socialMedia: null,
    cnpj: null,
    segment: null,
    avatarUrl: null,
    latitude: null,
    longitude: null,
    theme: null,
    clientCanCancelConfirmed: false,
    clientCancelConfirmedMinLeadMinutes: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };
  const mockManager = {
    getRepository: jest.fn(),
  };
  beforeEach(async () => {
    const mockTenantRepo = {
      create: jest.fn().mockReturnValue(mockTenant),
      save: jest.fn().mockResolvedValue(mockTenant),
    };
    const mockTenantUserRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockManager.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'TenantEntity') return mockTenantRepo;
      return mockTenantUserRepo;
    });
    dataSource = {
      transaction: jest.fn((cb) => cb(mockManager)),
    };
    const mockRepo = {
      existsBySlug: jest.fn().mockResolvedValue(false),
    };
    const mockAddressRepo = {
      create: jest.fn(),
      softDelete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTenantWithOwnerUseCase,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: TenantRepository, useValue: mockRepo },
        {
          provide: AddressRepository,
          useValue: mockAddressRepo,
        },
        {
          provide: CreateFreeSubscriptionUseCase,
          useValue: { run: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();
    useCase = module.get<CreateTenantWithOwnerUseCase>(
      CreateTenantWithOwnerUseCase,
    );
    tenantRepository = module.get(
      TenantRepository,
    ) as jest.Mocked<TenantRepository>;
    addressRepository = module.get(AddressRepository);
  });
  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });
  describe('run', () => {
    it('deve criar tenant e vinculo OWNER em transacao', async () => {
      const result = await useCase.run('user-uuid', {
        name: 'Barbearia Nova',
        slug: 'barbearia-nova',
        telephone: '5511999999999',
      });
      expect(tenantRepository.existsBySlug).toHaveBeenCalledWith(
        'barbearia-nova',
      );
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result).toEqual(mockTenant);
    });

    it('deve criar endereço e passar addressId ao tenant', async () => {
      addressRepository.create.mockResolvedValue({
        id: 'addr-uuid',
      });
      const tenantRepoCreate = jest.fn().mockReturnValue(mockTenant);
      const tenantRepoSave = jest.fn().mockResolvedValue(mockTenant);
      mockManager.getRepository.mockImplementation((entity: any) => {
        if (entity.name === 'TenantEntity') {
          return { create: tenantRepoCreate, save: tenantRepoSave };
        }
        return { create: jest.fn().mockReturnValue({}), save: jest.fn() };
      });

      await useCase.run('user-uuid', {
        name: 'Barbearia Nova',
        slug: 'barbearia-nova',
        telephone: '5511999999999',
        address: {
          street: 'Rua A',
          number: '1',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01001-000',
          country: 'Brazil',
        },
      });

      expect(addressRepository.create).toHaveBeenCalled();
      expect(tenantRepoCreate).toHaveBeenCalledWith(
        expect.objectContaining({ addressId: 'addr-uuid' }),
      );
    });
    it('deve lancar ConflictException quando slug ja existe', async () => {
      tenantRepository.existsBySlug.mockResolvedValue(true);
      await expect(
        useCase.run('user-uuid', {
          name: 'Barbearia Nova',
          slug: 'barbearia-nova',
          telephone: '5511999999999',
        }),
      ).rejects.toThrow(ConflictException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
    it('deve lancar BadRequestException quando slug invalido', async () => {
      await expect(
        useCase.run('user-uuid', { name: 'ab', telephone: '5511999999999' }),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
