import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantProfessionalRepository } from 'src/repository/tenant-professional/tenant-professional.repository';
import { TenantProfessionalEntity } from 'src/modules/tenant-professional/entities/tenant-professional.entity';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from 'src/modules/tenant-professional/entities/tenant-professional-status.enum';

describe('TenantProfessionalRepository', () => {
  let repository: TenantProfessionalRepository;
  let typeOrmRepo: jest.Mocked<Repository<TenantProfessionalEntity>>;

  const mockLink = {
    id: 'tp-uuid',
    tenantId: 'tenant-uuid',
    professionalProfileId: 'profile-uuid',
    role: TenantUserRole.BARBER,
    status: TenantProfessionalStatus.ACTIVE,
    joinedAt: new Date(),
    leftAt: null,
    createdAt: new Date(),
    professionalProfile: { id: 'profile-uuid', displayName: 'João' },
  } as TenantProfessionalEntity;

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockLink]),
  };

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantProfessionalRepository,
        {
          provide: getRepositoryToken(TenantProfessionalEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(TenantProfessionalRepository);
    typeOrmRepo = module.get(
      getRepositoryToken(TenantProfessionalEntity),
    ) as jest.Mocked<Repository<TenantProfessionalEntity>>;
  });

  it('create define status ACTIVE e leftAt null e recarrega com relações', async () => {
    typeOrmRepo.create.mockReturnValue(mockLink);
    typeOrmRepo.save.mockResolvedValue(mockLink);
    typeOrmRepo.findOne.mockResolvedValue(mockLink);

    const result = await repository.create({
      tenantId: 'tenant-uuid',
      professionalProfileId: 'profile-uuid',
      role: TenantUserRole.BARBER,
    });

    expect(typeOrmRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TenantProfessionalStatus.ACTIVE,
        leftAt: null,
      }),
    );
    expect(typeOrmRepo.findOne).toHaveBeenCalled();
    expect(result.professionalProfile).toBeDefined();
  });

  it('create lança erro quando reload após save falha', async () => {
    typeOrmRepo.create.mockReturnValue(mockLink);
    typeOrmRepo.save.mockResolvedValue(mockLink);
    typeOrmRepo.findOne.mockResolvedValue(null);

    await expect(
      repository.create({
        tenantId: 'tenant-uuid',
        professionalProfileId: 'profile-uuid',
        role: TenantUserRole.BARBER,
      }),
    ).rejects.toThrow('Tenant professional not found after create');
  });

  it('findById e findByTenantAndProfile consultam com relações', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockLink);

    await repository.findById('tp-uuid', 'tenant-uuid');
    await repository.findByTenantAndProfile('tenant-uuid', 'profile-uuid');

    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'tp-uuid', tenantId: 'tenant-uuid' },
      relations: { professionalProfile: true },
    });
    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-uuid', professionalProfileId: 'profile-uuid' },
      relations: { professionalProfile: true },
    });
  });

  it('listByTenant sem activeOnly não filtra status', async () => {
    await repository.listByTenant('tenant-uuid');
    expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
      'tp.status = :status',
      expect.anything(),
    );
  });

  it('listByTenant com activeOnly aplica filtros', async () => {
    await repository.listByTenant('tenant-uuid', { activeOnly: true });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'tp.status = :status',
      {
        status: TenantProfessionalStatus.ACTIVE,
      },
    );
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
      'pp.is_active = true',
    );
  });

  it('update aplica apenas campos informados e recarrega', async () => {
    typeOrmRepo.findOne.mockResolvedValue(mockLink);
    const leftAt = new Date('2022-01-01');

    await repository.update('tp-uuid', 'tenant-uuid', {
      role: TenantUserRole.ADMIN,
      status: TenantProfessionalStatus.INACTIVE,
      leftAt,
    });

    expect(typeOrmRepo.update).toHaveBeenCalledWith(
      { id: 'tp-uuid', tenantId: 'tenant-uuid' },
      {
        role: TenantUserRole.ADMIN,
        status: TenantProfessionalStatus.INACTIVE,
        leftAt,
      },
    );
  });

  it('update lança erro quando entidade não é encontrada após update', async () => {
    typeOrmRepo.findOne.mockResolvedValue(null);

    await expect(
      repository.update('tp-uuid', 'tenant-uuid', {
        status: TenantProfessionalStatus.LEFT,
      }),
    ).rejects.toThrow('Tenant professional not found after update');
  });
});
