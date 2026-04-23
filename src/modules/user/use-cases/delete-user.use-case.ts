import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interfaces/user-repository.interface';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { UserSyncService } from '../infrastructure/user-sync.service';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
    private readonly findUserById: FindUserByIdUseCase,
    private readonly userSyncService: UserSyncService,
  ) {}
  async run(id: string): Promise<UserResponseDto> {
    const user = await this.findUserById.run(id);
    if (!user) throw new NotFoundException('User not found!');
    if (user.firebaseUid) {
      await this.userSyncService.disableInFirebase(user.firebaseUid);
    }
    await this.repo.softDelete(id);
    return user;
  }
}
