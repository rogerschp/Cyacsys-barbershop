import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { IDecodedToken } from '../../ports/decoded-token.interface';
import { ITokenVerifier } from '../../ports/token-verifier.interface';

@Injectable()
export class FirebaseTokenVerifier implements ITokenVerifier {
  private readonly logger = new Logger(FirebaseTokenVerifier.name);

  async verifyIdToken(token: string): Promise<IDecodedToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      this.logger.log('Token verified successfully');
      return decodedToken as unknown as IDecodedToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error verifying token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
