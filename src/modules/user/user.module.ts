import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from '../../common/interfaces/password-hasher.interface';
import { PasswordService } from '../../common/services/password.service';
import { UserRepository } from '../../repository/user/user.repository';
import { UserController } from './user.controller';
import { UserEntity } from './entities/user.entity';
import { USER_REPOSITORY } from './interfaces/user-repository.interface';
import { UserService } from './user.service';
import { UserSyncService } from './infrastructure/user-sync.service';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [
    PasswordService,
    { provide: PASSWORD_HASHER, useClass: PasswordService },
    UserRepository,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    UserSyncService,
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
