/**
 * Interface para operações de usuário no Firebase Auth (porta driven – arquitetura hexagonal).
 * O caso de uso (UserSync / UserService) depende desta interface; o adapter (Firebase Admin) implementa.
 */

export interface CreateFirebaseUserInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface UpdateFirebaseUserInput {
  disabled?: boolean;
  displayName?: string;
  email?: string;
  password?: string;
}

export interface IFirebaseUserSync {
  createUser(input: CreateFirebaseUserInput): Promise<{ uid: string }>;
  getUser(
    uid: string,
  ): Promise<{ uid: string; email?: string; displayName?: string }>;
  updateUser(uid: string, input: UpdateFirebaseUserInput): Promise<void>;
  disableInFirebase(uid: string): Promise<void>;
}

export const FIREBASE_USER_SYNC = Symbol('FIREBASE_USER_SYNC');
