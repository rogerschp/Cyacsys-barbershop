import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAppInitializer implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAppInitializer.name);

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      return;
    }
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64?.trim()) {
      try {
        const json = Buffer.from(base64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(json) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log(
          'Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_BASE64',
        );
      } catch (error) {
        this.logger.error(
          'Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 (must be base64-encoded service account JSON)',
          error,
        );
        throw error;
      }
    } else {
      admin.initializeApp();
      this.logger.log(
        'Firebase Admin initialized with Application Default Credentials',
      );
    }
  }
}
