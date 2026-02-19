import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAppInitializer implements OnModuleInit {
  onModuleInit(): void {
    if (admin.apps.length > 0) {
      return;
    }
    admin.initializeApp();
  }
}
