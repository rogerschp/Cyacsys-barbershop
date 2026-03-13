import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreateBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/create-barber-profile.use-case';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { TenantUserService } from 'src/modules/tenant-user/tenant-user.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantUserRole } from 'src/modules/tenant-user/entities/tenant-user-role.enum';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';
import { CreateBarberProfileDto } from 'src/modules/barber-profile/dto/create-barber-profile.dto';
import { TenantUserEntity } from 'src/modules/tenant-user/entities/tenant-user.entity';

describe('CreateBarberProfileUseCase', () => {
  let useCase: CreateBarberProfileUseCase;
  let barberProfileRepository: {
    create: jest.Mock;
    findByTenantUserIdNonDeleted: jest.Mock;
  };
  let tenantUserService: { getByIdAndTenant: jest.Mock };

  const tenantId = 'tenant-uuid';
  const tenantUserId = 'tenant-user-uuid';
  const createdBy = 'user-uuid';
  const mockTenantUser: TenantUserEntity = {
    id: tenantUserId,
    tenantId,
    userId: 'user-uuid',
    role: TenantUserRole.BARBER,
    status: 'ACTIVE' as any,
    createdAt: new Date(),
  } as TenantUserEntity;

  const mockProfile: BarberProfileEntity = {
    id: 'profile-uuid',
    tenantId,
    tenantUserId,
    displayName: 'João Barbeiro',
    bio: 'Especialista em cortes',
    avatarUrl: 'https://example.com/avatar.jpg',
    experienceYears: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as BarberProfileEntity;

  const validDto: CreateBarberProfileDto = {
    tenantUserId,
    displayName: 'João Barbeiro',
    avatarUrl: 'https://example.com/avatar.jpg',
    experienceYears: 5,
    bio: 'Especialista em cortes',
  };

  beforeEach(async () => {
    barberProfileRepository = {
      create: jest.fn().mockResolvedValue(mockProfile),
      findByTenantUserIdNonDeleted: jest.fn().mockResolvedValue(null),
    };
    tenantUserService = {
      getByIdAndTenant: jest.fn().mockResolvedValue(mockTenantUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBarberProfileUseCase,
        { provide: BARBER_PROFILE_REPOSITORY, useValue: barberProfileRepository },
        { provide: TenantUserService, useValue: tenantUserService },
      ],
    }).compile();

    useCase = module.get<CreateBarberProfileUseCase>(CreateBarberProfileUseCase);
  });

  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });

  describe('run', () => {
    it('deve criar perfil quando tenantUser existe, é BARBER e não tem perfil', async () => {
      const result = await useCase.run(tenantId, validDto, createdBy);

      expect(tenantUserService.getByIdAndTenant).toHaveBeenCalledWith(
        tenantUserId,
        tenantId,
      );
      expect(barberProfileRepository.findByTenantUserIdNonDeleted).toHaveBeenCalledWith(
        tenantId,
        tenantUserId,
      );
      expect(barberProfileRepository.create).toHaveBeenCalledWith({
        tenantId,
        tenantUserId,
        displayName: 'João Barbeiro',
        bio: 'Especialista em cortes',
        avatarUrl: 'https://example.com/avatar.jpg',
        experienceYears: 5,
      });
      expect(result).toEqual(mockProfile);
    });

    it('deve lançar NotFoundException quando tenantUser não existe', async () => {
      tenantUserService.getByIdAndTenant.mockRejectedValue(
        new NotFoundException('TENANT_USER_NOT_FOUND'),
      );

      await expect(useCase.run(tenantId, validDto, createdBy)).rejects.toThrow(
        NotFoundException,
      );

      expect(barberProfileRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessRuleException quando role do tenantUser não é BARBER', async () => {
      tenantUserService.getByIdAndTenant.mockResolvedValue({
        ...mockTenantUser,
        role: TenantUserRole.ADMIN,
      });

      await expect(useCase.run(tenantId, validDto, createdBy)).rejects.toThrow(
        BusinessRuleException,
      );
      expect(barberProfileRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessRuleException quando já existe perfil para o tenantUserId', async () => {
      barberProfileRepository.findByTenantUserIdNonDeleted.mockResolvedValue(
        mockProfile,
      );

      await expect(useCase.run(tenantId, validDto, createdBy)).rejects.toThrow(
        BusinessRuleException,
      );
      expect(barberProfileRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar BusinessRuleException quando experienceYears é negativo', async () => {
      await expect(
        useCase.run(tenantId, { ...validDto, experienceYears: -1 }, createdBy),
      ).rejects.toThrow(BusinessRuleException);
      expect(barberProfileRepository.create).not.toHaveBeenCalled();
    });

    it('deve normalizar displayName com trim', async () => {
      await useCase.run(
        tenantId,
        { ...validDto, displayName: '  João Barbeiro  ' },
        createdBy,
      );

      expect(barberProfileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'João Barbeiro' }),
      );
    });

    it('deve passar bio null quando não informada', async () => {
      const dtoSemBio = { ...validDto };
      delete (dtoSemBio as Partial<CreateBarberProfileDto>).bio;
      await useCase.run(tenantId, dtoSemBio, createdBy);

      expect(barberProfileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ bio: null }),
      );
    });
  });
});
