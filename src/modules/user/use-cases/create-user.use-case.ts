import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interfaces/user-repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from 'src/common/interfaces/password-hasher.interface';
import { UserSyncService } from '../infrastructure/user-sync.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../entities/user.entity';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { FindUserByEmailUseCase } from './find-user-by-email.use-case';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly findUserByEmail: FindUserByEmailUseCase,
    @Inject(PASSWORD_HASHER)
    private readonly passwordService: IPasswordHasher,
    private readonly userSyncService: UserSyncService,
  ) {}
  async run(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.findUserByEmail.run(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.repo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role,
    });
    try {
      const { uid } = await this.userSyncService.createInFirebase({
        email: dto.email,
        password: dto.password,
        displayName: dto.name,
      });
      await this.repo.setFirebaseUid(user.id, uid);
      const created = await this.findUserById.run(user.id);
      return created ?? user;
    } catch (err) {
      await this.repo.softDelete(user.id);
      throw err;
    }
  }
}
