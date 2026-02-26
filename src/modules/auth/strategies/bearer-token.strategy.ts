import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { IDecodedToken } from '../ports/decoded-token.interface';
import {
  ITokenVerifier,
  TOKEN_VERIFIER,
} from '../ports/token-verifier.interface';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class BearerTokenStrategy extends PassportStrategy(Strategy, 'bearer') {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: ITokenVerifier,
  ) {
    super();
  }

  async validate(req: Request): Promise<IDecodedToken> {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    const token = authHeader.startsWith(BEARER_PREFIX)
      ? authHeader.slice(BEARER_PREFIX.length).trim()
      : authHeader.trim();

    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    return this.tokenVerifier.verifyIdToken(token);
  }
}
