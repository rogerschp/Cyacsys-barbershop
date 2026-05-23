import { Global, Module } from '@nestjs/common';
import { FIREBASE_USER_SYNC } from './interfaces/firebase-user-sync.interface';
import { FirebaseAppInitializer } from './firebase-app.initializer';
import { FirebaseUserSyncService } from './firebase-user-sync.service';
@Global()
@Module({
  providers: [
    FirebaseAppInitializer,
    FirebaseUserSyncService,
    { provide: FIREBASE_USER_SYNC, useClass: FirebaseUserSyncService },
  ],
  exports: [FIREBASE_USER_SYNC],
})
export class FirebaseModule {}
