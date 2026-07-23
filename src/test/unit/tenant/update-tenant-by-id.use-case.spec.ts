import { NotFoundException } from '@nestjs/common';
import { UpdateTenantByIdUseCase } from 'src/modules/tenant/use-cases/update-tenant-by-id.use-case';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { AddressRepository } from 'src/repository/address/address.repository';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';

describe('UpdateTenantByIdUseCase', () => {
  const tenantId = 'tenant-uuid';
  const addressPayload = {
    street: 'Rua A',
    number: '100',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01001-000',
    country: 'Brazil',
  };

  const baseTenant = {
    id: tenantId,
    slug: 'barbearia',
    name: 'Barbearia',
    status: TenantStatus.ACTIVE,
    telephone: '5511999999999',
    addressId: null as string | null,
    address: null,
    timezone: 'America/Sao_Paulo',
    socialMedia: null,
    cnpj: null,
    segment: null,
    logoMediaId: null,
    latitude: null,
    longitude: null,
    theme: null,
    clientCanCancelConfirmed: false,
    clientCancelConfirmedMinLeadMinutes: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let repo: {
    findById: jest.Mock;
    update: jest.Mock;
  };
  let addressRepository: {
    create: jest.Mock;
    update: jest.Mock;
  };
  let findTenantById: {
    run: jest.Mock;
  };
  let useCase: UpdateTenantByIdUseCase;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(baseTenant),
    };
    addressRepository = {
      create: jest.fn(),
      update: jest.fn(),
    };
    findTenantById = {
      run: jest.fn().mockResolvedValue({
        ...baseTenant,
        addressId: 'addr-1',
        address: addressPayload,
      }),
    };
    useCase = new UpdateTenantByIdUseCase(
      repo as unknown as TenantRepository,
      addressRepository as unknown as AddressRepository,
      findTenantById as unknown as FindTenantByIdUseCase,
    );
  });

  it('cria endereço e vincula addressId quando tenant ainda não tem', async () => {
    repo.findById.mockResolvedValue({ ...baseTenant, addressId: null });
    addressRepository.create.mockResolvedValue({
      id: 'addr-new',
      ...addressPayload,
    });

    await useCase.run(tenantId, { address: addressPayload });

    expect(addressRepository.create).toHaveBeenCalledWith(addressPayload);
    expect(addressRepository.update).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(tenantId, {
      addressId: 'addr-new',
    });
    expect(findTenantById.run).toHaveBeenCalledWith(tenantId);
  });

  it('atualiza endereço existente sem recriar', async () => {
    repo.findById.mockResolvedValue({
      ...baseTenant,
      addressId: 'addr-existing',
    });
    addressRepository.update.mockResolvedValue({
      id: 'addr-existing',
      ...addressPayload,
    });

    await useCase.run(tenantId, {
      name: 'Novo Nome',
      address: addressPayload,
    });

    expect(addressRepository.update).toHaveBeenCalledWith(
      'addr-existing',
      addressPayload,
    );
    expect(addressRepository.create).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(tenantId, {
      name: 'Novo Nome',
      addressId: 'addr-existing',
    });
  });

  it('não mexe em address quando o body não envia address', async () => {
    repo.findById.mockResolvedValue({
      ...baseTenant,
      addressId: 'addr-existing',
    });
    findTenantById.run.mockResolvedValue({
      ...baseTenant,
      name: 'Só nome',
      addressId: 'addr-existing',
    });

    await useCase.run(tenantId, { name: 'Só nome' });

    expect(addressRepository.create).not.toHaveBeenCalled();
    expect(addressRepository.update).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith(tenantId, { name: 'Só nome' });
  });

  it('lança NotFound quando tenant não existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.run(tenantId, { name: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
