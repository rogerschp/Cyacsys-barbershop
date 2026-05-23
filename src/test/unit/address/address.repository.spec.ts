import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressRepository } from 'src/repository/address/address.repository';
import { AddressEntity } from 'src/modules/address/entities/address.entity';

describe('AddressRepository', () => {
  let repository: AddressRepository;
  let typeOrmRepo: jest.Mocked<Repository<AddressEntity>>;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressRepository,
        {
          provide: getRepositoryToken(AddressEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(AddressRepository);
    typeOrmRepo = module.get(getRepositoryToken(AddressEntity)) as jest.Mocked<
      Repository<AddressEntity>
    >;
  });

  it('create persiste endereço', async () => {
    const entity = { id: 'addr-1', street: 'Rua A' } as AddressEntity;
    typeOrmRepo.create.mockReturnValue(entity);
    typeOrmRepo.save.mockResolvedValue(entity);

    const result = await repository.create({ street: 'Rua A' });

    expect(typeOrmRepo.create).toHaveBeenCalledWith({ street: 'Rua A' });
    expect(result).toBe(entity);
  });

  it('softDelete remove logicamente por id', async () => {
    await repository.softDelete('addr-1');
    expect(typeOrmRepo.softDelete).toHaveBeenCalledWith('addr-1');
  });
});
