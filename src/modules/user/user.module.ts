import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from '../../common/interfaces/password-hasher.interface';
import { PasswordService } from '../../common/services/password.service';
import { UserRepository } from '../../repository/user/user.repository';
import { UserController } from './user.controller';
import { UserEntity } from './entities/user.entity';
import { USER_REPOSITORY } from './interfaces/user-repository.interface';
import { UserSyncService } from './infrastructure/user-sync.service';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { FindUserByEmailUseCase } from './use-cases/find-user-by-email.use-case';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.use-case';
import { FindUserByFirebaseUidUseCase } from './use-cases/find-user-by-fireabse.use-case';
import { SyncUserWithFirebaseUseCase } from './use-cases/sync-user-with-firebase.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { ValidateUserAccessUseCase } from './use-cases/validate-user-access.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { AddressModule } from '../address/address.module';
import { AuthModule } from '../auth/auth.module';
import { CheckUserExistsByEmailUseCase } from './use-cases/check-user-exists-by-email.use-case';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AddressModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [
    PasswordService,
    { provide: PASSWORD_HASHER, useClass: PasswordService },
    UserRepository,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    UserSyncService,
    CreateUserUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    FindUserByFirebaseUidUseCase,
    SyncUserWithFirebaseUseCase,
    UpdateUserUseCase,
    ValidateUserAccessUseCase,
    DeleteUserUseCase,
    CheckUserExistsByEmailUseCase,
  ],
  exports: [
    USER_REPOSITORY,
    PASSWORD_HASHER,
    FindUserByIdUseCase,
    FindUserByFirebaseUidUseCase,
    ValidateUserAccessUseCase,
    SyncUserWithFirebaseUseCase,
    FindUserByEmailUseCase,
  ],
})
export class UserModule {}
