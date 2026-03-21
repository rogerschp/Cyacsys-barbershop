import { Test, TestingModule } from '@nestjs/testing';
import { ListBarberProfilesUseCase } from 'src/modules/barber-profile/use-cases/list-barber-profiles.use-case';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';

describe('ListBarberProfilesUseCase', () => {
  let useCase: ListBarberProfilesUseCase;
  let barberProfileRepository: { listByTenant: jest.Mock };

  const tenantId = 'tenant-uuid';
  const mockProfiles: BarberProfileEntity[] = [
    {
      id: 'profile-1',
      tenantId,
      tenantUserId: 'tu-1',
      displayName: 'João',
      bio: null,
      avatarUrl: 'https://example.com/1.jpg',
      experienceYears: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    } as BarberProfileEntity,
  ];

  beforeEach(async () => {
    barberProfileRepository = {
      listByTenant: jest.fn().mockResolvedValue(mockProfiles),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListBarberProfilesUseCase,
        { provide: BARBER_PROFILE_REPOSITORY, useValue: barberProfileRepository },
      ],
    }).compile();

    useCase = module.get<ListBarberProfilesUseCase>(ListBarberProfilesUseCase);
  });

  it('deve estar definido', () => {
    expect(useCase).toBeDefined();
  });

  describe('run', () => {
    it('deve retornar lista de perfis do tenant', async () => {
      const result = await useCase.run(tenantId);

      expect(barberProfileRepository.listByTenant).toHaveBeenCalledWith(
        tenantId,
      );
      expect(result).toEqual(mockProfiles);
    });

    it('deve retornar array vazio quando tenant não tem perfis', async () => {
      barberProfileRepository.listByTenant.mockResolvedValue([]);

      const result = await useCase.run(tenantId);

      expect(result).toEqual([]);
    });
  });
});
