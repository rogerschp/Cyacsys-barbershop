import { ConflictException, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  IFirebaseUserSync,
  CreateFirebaseUserInput,
  UpdateFirebaseUserInput,
} from './interfaces/firebase-user-sync.interface';

@Injectable()
export class FirebaseUserSyncService implements IFirebaseUserSync {
  private readonly logger = new Logger(FirebaseUserSyncService.name);

  async createUser(input: CreateFirebaseUserInput): Promise<{ uid: string }> {
    try {
      const userRecord = await admin.auth().createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName ?? input.email.split('@')[0],
      });
      this.logger.log(
        `Firebase user created: ${userRecord.uid} (${input.email})`,
      );
      return { uid: userRecord.uid };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      const message = error instanceof Error ? error.message : String(error);
      const isEmailExists =
        code === 'auth/email-already-exists' ||
        message?.includes('email already exists') ||
        message?.includes('already in use');
      if (isEmailExists) {
        this.logger.warn(`Firebase user already exists for ${input.email}`);
        throw new ConflictException(
          'Email already registered in Firebase. User must be created through the system (DB first, then sync).',
        );
      }
      this.logger.error('Firebase createUser failed', error);
      throw error;
    }
  }

  async getUser(
    uid: string,
  ): Promise<{ uid: string; email?: string; displayName?: string }> {
    const record = await admin.auth().getUser(uid);
    return {
      uid: record.uid,
      email: record.email,
      displayName: record.displayName ?? undefined,
    };
  }

  async updateUser(uid: string, input: UpdateFirebaseUserInput): Promise<void> {
    const updates: admin.auth.UpdateRequest = {};
    if (input.disabled !== undefined) updates.disabled = input.disabled;
    if (input.displayName !== undefined)
      updates.displayName = input.displayName;
    if (input.email !== undefined) updates.email = input.email;
    if (input.password !== undefined) updates.password = input.password;
    if (Object.keys(updates).length === 0) return;
    try {
      await admin.auth().updateUser(uid, updates);
      this.logger.log(`Firebase user updated: ${uid}`);
    } catch (error) {
      this.logger.error(`Firebase updateUser failed for ${uid}`, error);
      throw error;
    }
  }

  async disableInFirebase(uid: string): Promise<void> {
    await this.updateUser(uid, { disabled: true });
  }
}
