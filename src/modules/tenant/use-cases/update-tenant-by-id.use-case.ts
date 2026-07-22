import { Injectable, NotFoundException } from '@nestjs/common';
import { AddressRepository } from 'src/repository/address/address.repository';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { FindTenantByIdUseCase } from './find-tenant-by-id.use-case';
import { TenantResponseDto } from '../dto/tenant-response.dto';

@Injectable()
export class UpdateTenantByIdUseCase {
  constructor(
    private readonly repo: TenantRepository,
    private readonly addressRepository: AddressRepository,
    private readonly findTenantById: FindTenantByIdUseCase,
  ) {}

  async run(
    id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.repo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found!');

    const { address, ...rest } = updateTenantDto;
    let addressId = tenant.addressId;

    if (address) {
      const addressFields = {
        street: address.street,
        number: address.number,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      };
      if (addressId) {
        await this.addressRepository.update(addressId, addressFields);
      } else {
        const created = await this.addressRepository.create(addressFields);
        addressId = created.id;
      }
    }

    await this.repo.update(id, {
      ...rest,
      ...(address !== undefined ? { addressId } : {}),
    });

    return this.findTenantById.run(id);
  }
}
