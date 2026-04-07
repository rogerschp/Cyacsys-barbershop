import { Inject, Injectable } from '@nestjs/common';
import { BarberProfileEntity } from '../entities/barber-profile.entity';
import {
  BARBER_PROFILE_REPOSITORY,
  IBarberProfileRepository,
} from '../interfaces/barber-profile-repository.interface';

@Injectable()
export class ListBarberProfilesUseCase {
  constructor(
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
  ) {}

  async run(tenantId: string): Promise<BarberProfileEntity[]> {
    return this.barberProfileRepository.listByTenant(tenantId);
  }
}
