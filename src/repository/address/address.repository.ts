import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressEntity } from 'src/modules/address/entities/address.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AddressRepository {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly repo: Repository<AddressEntity>,
  ) {}

  async create(data: Partial<AddressEntity>): Promise<AddressEntity> {
    const address = this.repo.create(data);
    return this.repo.save(address);
  }
  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
