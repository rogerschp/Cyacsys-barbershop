import { Inject, Injectable } from '@nestjs/common';
import {
  IFirebaseUserSync,
  CreateFirebaseUserInput,
  UpdateFirebaseUserInput,
  FIREBASE_USER_SYNC,
} from '../firebase/interfaces/firebase-user-sync.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from './interfaces/user-repository.interface';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserSyncService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    @Inject(FIREBASE_USER_SYNC)
    private readonly firebaseUserSync: IFirebaseUserSync,
  ) {}

  async syncFromFirebase(firebaseUid: string): Promise<UserEntity | null> {
    const dbUser = await this.repo.findByFirebaseUid(firebaseUid);
    if (!dbUser) return null;

    try {
      const firebaseUser = await this.firebaseUserSync.getUser(firebaseUid);
      const updates: { email?: string; name?: string } = {};
      if (firebaseUser.email && firebaseUser.email !== dbUser.email) {
        updates.email = firebaseUser.email;
      }
      const displayName =
        firebaseUser.displayName ??
        firebaseUser.email?.split('@')[0] ??
        undefined;
      if (displayName && displayName !== dbUser.name) {
        updates.name = displayName;
      }
      if (Object.keys(updates).length > 0) {
        await this.repo.update(dbUser.id, updates);
        const updated = await this.repo.findById(dbUser.id);
        return updated ?? dbUser;
      }
      return dbUser;
    } catch {
      return dbUser;
    }
  }

  async syncToFirebase(
    firebaseUid: string,
    payload: UpdateFirebaseUserInput,
  ): Promise<void> {
    if (Object.keys(payload).length === 0) return;
    await this.firebaseUserSync.updateUser(firebaseUid, payload);
  }

  async createInFirebase(
    input: CreateFirebaseUserInput,
  ): Promise<{ uid: string }> {
    return this.firebaseUserSync.createUser(input);
  }

  async disableInFirebase(firebaseUid: string): Promise<void> {
    await this.firebaseUserSync.disableInFirebase(firebaseUid);
  }
}
