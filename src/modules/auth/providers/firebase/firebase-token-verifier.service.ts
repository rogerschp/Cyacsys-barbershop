import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { IDecodedToken } from '../../interfaces/decoded-token.interface';
import { ITokenVerifier } from '../../interfaces/token-verifier.interface';
@Injectable()
export class FirebaseTokenVerifier implements ITokenVerifier {
  private readonly logger = new Logger(FirebaseTokenVerifier.name);
  async verifyIdToken(token: string): Promise<IDecodedToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      return decodedToken as unknown as IDecodedToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn('Error verifying token');
      throw new UnauthorizedException('Invalid token');
    }
  }
}
