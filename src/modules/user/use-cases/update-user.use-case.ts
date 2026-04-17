import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interfaces/user-repository.interface';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { FindUserByEmailUseCase } from './find-user-by-email.use-case';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from 'src/common/interfaces/password-hasher.interface';
import { UserSyncService } from '../infrastructure/user-sync.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { Role } from 'src/common/enums/role.enum';
import { UserStatus } from '../entities/user-status.enum';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly findUserById: FindUserByIdUseCase,
    private readonly findUserByEmail: FindUserByEmailUseCase,
    @Inject(PASSWORD_HASHER)
    private readonly passwordService: IPasswordHasher,
    private readonly repo: IUserRepository,
    private readonly userSyncService: UserSyncService,
  ) {}
  async run(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findUserById.run(id);
    if (!user) throw new NotFoundException('User not found');
    const data: {
      name?: string;
      status?: UserStatus;
      role?: Role;
      passwordHash?: string;
    } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password) {
      data.passwordHash = await this.passwordService.hash(dto.password);
    }
    await this.repo.update(id, data);
    if (user.firebaseUid) {
      const firebaseUpdate: {
        disabled?: boolean;
        displayName?: string;
        password?: string;
      } = {};
      if (dto.status !== undefined) {
        firebaseUpdate.disabled = status !== UserStatus.ACTIVE;
      }
      if (dto.name !== undefined) firebaseUpdate.displayName = dto.name;
      if (dto.password) firebaseUpdate.password = dto.password;
      if (Object.keys(firebaseUpdate).length > 0) {
        await this.userSyncService.syncToFirebase(
          user.firebaseUid,
          firebaseUpdate,
        );
      }
    }
    const updated = await this.findUserById.run(id);
    if (!updated) throw new NotFoundException('User not found!');
    return updated;
  }
}
