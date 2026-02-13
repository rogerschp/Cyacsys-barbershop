import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { Request } from 'express';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  private readonly logger = new Logger(FirebaseStrategy.name);

  async validate(req: Request): Promise<DecodedIdToken> {
    try {
      const authHeader = req.headers.authorization;
      this.logger.debug(`Authorization header: ${authHeader}`);
      if (!authHeader) {
        throw new UnauthorizedException('No authorization header provided');
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : authHeader.trim();

      this.logger.debug(`Token: ${token}`);

      if (!token) {
        this.logger.warn('Token is empty');
        throw new UnauthorizedException('Invalid token format');
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      this.logger.log('Token verified successfully');

      return decodedToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error verifying token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
