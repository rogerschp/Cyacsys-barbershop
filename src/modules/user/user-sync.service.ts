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

/**
 * Orquestra sync entre banco (fonte da verdade de negócio) e Firebase Auth (identidade).
 * Depende das portas (hexagonal); adapters injetados pelo módulo.
 */
@Injectable()
export class UserSyncService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    @Inject(FIREBASE_USER_SYNC)
    private readonly firebaseUserSync: IFirebaseUserSync,
  ) {}

  /**
   * Busca usuário no Firebase e atualiza no banco apenas dados básicos (email, name).
   * Preserva role e status do banco. Não cria usuário no banco se não existir.
   */
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

  /**
   * Reflete alterações do banco no Firebase (disabled, displayName, email, password).
   */
  async syncToFirebase(
    firebaseUid: string,
    payload: UpdateFirebaseUserInput,
  ): Promise<void> {
    if (Object.keys(payload).length === 0) return;
    await this.firebaseUserSync.updateUser(firebaseUid, payload);
  }

  /**
   * Cria usuário no Firebase Auth (usado ao criar usuário no sistema: DB primeiro, depois este método).
   */
  async createInFirebase(
    input: CreateFirebaseUserInput,
  ): Promise<{ uid: string }> {
    return this.firebaseUserSync.createUser(input);
  }

  /**
   * Desabilita o usuário no Firebase (sync ao desativar ou deletar no banco).
   */
  async disableInFirebase(firebaseUid: string): Promise<void> {
    await this.firebaseUserSync.disableInFirebase(firebaseUid);
  }
}
