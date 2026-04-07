import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { BarberProfileEntity } from '../entities/barber-profile.entity';
import { BARBER_PROFILE_REPOSITORY, IBarberProfileRepository, } from '../interfaces/barber-profile-repository.interface';
@Injectable()
export class GetBarberProfileUseCase {
    constructor(
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository) { }
    async run(tenantId: string, barberProfileId: string): Promise<BarberProfileEntity> {
        const profile = await this.barberProfileRepository.findById(barberProfileId, tenantId);
        if (!profile) {
            throw new NotFoundException('Barber profile not found');
        }
        return profile;
    }
}
