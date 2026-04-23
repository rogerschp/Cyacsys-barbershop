import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interfaces/user-repository.interface';
import { UserEntity } from '../entities/user.entity';
import { UserStatus } from '../entities/user-status.enum';

@Injectable()
export class FindUserByFirebaseUidUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository,
  ) {}
  async run(firebaseUid: string): Promise<UserEntity> {
    const user = await this.repo.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new UnauthorizedException(
        'User not found in database. Only users created through the system (DB then Firebase sync) can sign in.',
      );
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active. Access denied.');
    }
    return user;
  }
}
