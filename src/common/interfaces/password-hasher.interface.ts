/**
 * Interface para hash e comparação de senha (porta driven – arquitetura hexagonal).
 * Casos de uso dependem desta interface; o adapter (bcrypt) implementa.
 */

export interface IPasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
