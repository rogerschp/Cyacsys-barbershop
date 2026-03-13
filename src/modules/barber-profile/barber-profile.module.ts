import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarberProfileRepository } from '../../repository/barber-profile/barber-profile.repository';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { BarberProfileEntity } from './entities/barber-profile.entity';
import { BARBER_PROFILE_REPOSITORY } from './interfaces/barber-profile-repository.interface';
import { BarberProfileController } from './barber-profile.controller';
import { CreateBarberProfileUseCase } from './use-cases/create-barber-profile.use-case';
import { DeactivateBarberProfileUseCase } from './use-cases/deactivate-barber-profile.use-case';
import { GetBarberProfileUseCase } from './use-cases/get-barber-profile.use-case';
import { ListBarberProfilesUseCase } from './use-cases/list-barber-profiles.use-case';
import { UpdateBarberProfileUseCase } from './use-cases/update-barber-profile.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([BarberProfileEntity]),
    AuthModule,
    TenantModule,
    TenantUserModule,
  ],
  controllers: [BarberProfileController],
  providers: [
    BarberProfileRepository,
    { provide: BARBER_PROFILE_REPOSITORY, useClass: BarberProfileRepository },
    CreateBarberProfileUseCase,
    UpdateBarberProfileUseCase,
    DeactivateBarberProfileUseCase,
    ListBarberProfilesUseCase,
    GetBarberProfileUseCase,
  ],
  exports: [BARBER_PROFILE_REPOSITORY],
})
export class BarberProfileModule {}
