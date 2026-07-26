import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantInvitationEntity } from 'src/modules/team/entities/tenant-invitation.entity';
import { TenantInvitationStatus } from 'src/modules/team/enums/tenant-invitation-status.enum';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { TenantInvitationRepository } from 'src/repository/team/tenant-invitation.repository';

describe('TenantInvitationRepository', () => {
  let repository: TenantInvitationRepository;
  let typeOrmRepo: jest.Mocked<
    Pick<
      Repository<TenantInvitationEntity>,
      'create' | 'save' | 'findOne' | 'find' | 'update'
    >
  >;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantInvitationRepository,
        {
          provide: getRepositoryToken(TenantInvitationEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(TenantInvitationRepository);
    typeOrmRepo = module.get(getRepositoryToken(TenantInvitationEntity));
  });

  it('create salva invitation PENDING', async () => {
    const entity = { id: 'inv-1' } as TenantInvitationEntity;
    typeOrmRepo.create.mockReturnValue(entity);
    typeOrmRepo.save.mockResolvedValue(entity);

    const expiresAt = new Date('2026-08-01T00:00:00.000Z');
    await repository.create({
      tenantId: 'tenant-1',
      email: 'a@b.com',
      role: TenantUserRole.BARBER,
      token: 'tok',
      expiresAt,
      createdByUserId: 'owner-1',
    });

    expect(typeOrmRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TenantInvitationStatus.PENDING,
        acceptedAt: null,
        token: 'tok',
      }),
    );
  });

  it('findPendingByTenantAndEmail filtra PENDING', async () => {
    typeOrmRepo.findOne.mockResolvedValue(null);
    await repository.findPendingByTenantAndEmail('tenant-1', 'a@b.com');
    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        email: 'a@b.com',
        status: TenantInvitationStatus.PENDING,
      },
    });
  });
});
