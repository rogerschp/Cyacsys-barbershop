import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetBarberProfileUseCase } from 'src/modules/barber-profile/use-cases/get-barber-profile.use-case';
import { BARBER_PROFILE_REPOSITORY } from 'src/modules/barber-profile/interfaces/barber-profile-repository.interface';
import { BarberProfileEntity } from 'src/modules/barber-profile/entities/barber-profile.entity';
describe('GetBarberProfileUseCase', () => {
    let useCase: GetBarberProfileUseCase;
    let barberProfileRepository: {
        findById: jest.Mock;
    };
    const tenantId = 'tenant-uuid';
    const profileId = 'profile-uuid';
    const mockProfile: BarberProfileEntity = {
        id: profileId,
        tenantId,
        tenantUserId: 'tenant-user-uuid',
        displayName: 'João Barbeiro',
        bio: 'Bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        experienceYears: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
    } as BarberProfileEntity;
    beforeEach(async () => {
        barberProfileRepository = {
            findById: jest.fn().mockResolvedValue(mockProfile),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetBarberProfileUseCase,
                { provide: BARBER_PROFILE_REPOSITORY, useValue: barberProfileRepository },
            ],
        }).compile();
        useCase = module.get<GetBarberProfileUseCase>(GetBarberProfileUseCase);
    });
    it('deve estar definido', () => {
        expect(useCase).toBeDefined();
    });
    describe('run', () => {
        it('deve retornar perfil quando existe no tenant', async () => {
            const result = await useCase.run(tenantId, profileId);
            expect(barberProfileRepository.findById).toHaveBeenCalledWith(profileId, tenantId);
            expect(result).toEqual(mockProfile);
        });
        it('deve lançar NotFoundException quando perfil não existe', async () => {
            barberProfileRepository.findById.mockResolvedValue(null);
            await expect(useCase.run(tenantId, profileId)).rejects.toThrow(NotFoundException);
        });
    });
});
