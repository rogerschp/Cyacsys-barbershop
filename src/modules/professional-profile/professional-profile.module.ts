import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalProfileRepository } from '../../repository/professional-profile/professional-profile.repository';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ProfessionalProfileEntity } from './entities/professional-profile.entity';
import { PROFESSIONAL_PROFILE_REPOSITORY } from './interfaces/professional-profile-repository.interface';
import { ProfessionalProfileController } from './professional-profile.controller';
import { CreateProfessionalProfileUseCase } from './use-cases/create-professional-profile.use-case';
import { DeactivateProfessionalProfileUseCase } from './use-cases/deactivate-professional-profile.use-case';
import { GetProfessionalProfileByIdUseCase } from './use-cases/get-professional-profile-by-id.use-case';
import { GetProfessionalProfileByUserUseCase } from './use-cases/get-professional-profile-by-user.use-case';
import { UpdateProfessionalProfileUseCase } from './use-cases/update-professional-profile.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfessionalProfileEntity]),
    AuthModule,
    UserModule,
  ],
  controllers: [ProfessionalProfileController],
  providers: [
    ProfessionalProfileRepository,
    {
      provide: PROFESSIONAL_PROFILE_REPOSITORY,
      useClass: ProfessionalProfileRepository,
    },
    CreateProfessionalProfileUseCase,
    UpdateProfessionalProfileUseCase,
    DeactivateProfessionalProfileUseCase,
    GetProfessionalProfileByUserUseCase,
    GetProfessionalProfileByIdUseCase,
  ],
  exports: [
    PROFESSIONAL_PROFILE_REPOSITORY,
    GetProfessionalProfileByIdUseCase,
    GetProfessionalProfileByUserUseCase,
  ],
})
export class ProfessionalProfileModule {}
