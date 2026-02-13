import { IDecodedToken } from './decoded-token.interface';

export interface ITokenVerifier {
  verifyIdToken(token: string): Promise<IDecodedToken>;
}

export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');
