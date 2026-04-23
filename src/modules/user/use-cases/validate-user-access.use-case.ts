import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  FIREBASE_USER_SYNC,
  IFirebaseUserSync,
} from 'src/modules/firebase/interfaces/firebase-user-sync.interface';
import { FindUserByFirebaseUidUseCase } from './find-user-by-fireabse.use-case';
import { UserStatus } from '../entities/user-status.enum';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class ValidateUserAccessUseCase {
  constructor(
    private readonly findUserByFirebaseUidUseCase: FindUserByFirebaseUidUseCase,
    @Inject(FIREBASE_USER_SYNC)
    private readonly firebaseUserSync: IFirebaseUserSync,
  ) {}
  async run(firebaseUid: string): Promise<UserEntity> {
    const [firebaseUser, dbUser] = await Promise.all([
      this.firebaseUserSync.getUser(firebaseUid),
      this.findUserByFirebaseUidUseCase.run(firebaseUid),
    ]);
    if (!dbUser) {
      throw new UnauthorizedException(
        'User not found in database. Only users created through the system (DB then Firebase sync) can sign in.',
      );
    }
    if (!firebaseUser) {
      throw new UnauthorizedException(
        'User not found in Firebase. Only users created through the system (DB then Firebase sync) can sign in.',
      );
    }
    if (dbUser.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active. Access denied.');
    }

    return dbUser;
  }
}
