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
  } as TenantProfessionalEntity;

  const mockQueryBuilder = {
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

  it('create define status ACTIVE e leftAt null', async () => {
    typeOrmRepo.create.mockReturnValue(mockLink);
    typeOrmRepo.save.mockResolvedValue(mockLink);

    await repository.create({
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
  });
});
