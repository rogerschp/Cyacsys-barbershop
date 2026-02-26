import { ConflictException, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  IFirebaseUserSync,
  CreateFirebaseUserInput,
  UpdateFirebaseUserInput,
} from './interfaces/firebase-user-sync.interface';

/** Adapter Firebase Admin para IFirebaseUserSync (porta de identidade – arquitetura hexagonal). */
@Injectable()
export class FirebaseUserSyncService implements IFirebaseUserSync {
  private readonly logger = new Logger(FirebaseUserSyncService.name);

  /**
   * Cria o usuário no Firebase e retorna o uid para gravar no banco.
   * @throws ConflictException se o email já existir no Firebase (usuário não foi criado pelo sistema)
   */
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

  /**
   * Busca o usuário no Firebase Auth (para sync com o banco). Retorna DTO da porta (sem dependência de Firebase no domínio).
   */
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

  /**
   * Atualiza o usuário no Firebase (sync com o banco: status → disabled, nome, senha).
   */
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

  /**
   * Desabilita o usuário no Firebase Auth (sync ao desativar/deletar no banco).
   */
  async disableInFirebase(uid: string): Promise<void> {
    await this.updateUser(uid, { disabled: true });
  }
}
