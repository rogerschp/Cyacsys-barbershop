import { Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import { UserSyncService } from '../infrastructure/user-sync.service';

@Injectable()
export class SyncUserWithFirebaseUseCase {
  constructor(private readonly userSyncService: UserSyncService) {}
  async run(firebaseUid: string): Promise<UserEntity> {
    return await this.userSyncService.syncFromFirebase(firebaseUid);
  }
}
