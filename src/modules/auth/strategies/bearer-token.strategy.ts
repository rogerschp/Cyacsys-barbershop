import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { UserEntity } from '../../user/entities/user.entity';
import { UserStatus } from '../../user/entities/user-status.enum';
import { UserService } from '../../user/user.service';
import { IDecodedToken } from '../interfaces/decoded-token.interface';
import {
  ITokenVerifier,
  TOKEN_VERIFIER,
} from '../interfaces/token-verifier.interface';

const BEARER_PREFIX = 'Bearer ';

export type RequestUser = IDecodedToken & { dbUser: UserEntity };

@Injectable()
export class BearerTokenStrategy extends PassportStrategy(Strategy, 'bearer') {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: ITokenVerifier,
    private readonly userService: UserService,
  ) {
    super();
  }

  async validate(req: Request): Promise<RequestUser> {
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

    const decoded = await this.tokenVerifier.verifyIdToken(token);
    const dbUser = await this.userService.findByFirebaseUid(decoded.uid);
    if (!dbUser) {
      throw new UnauthorizedException('User not found in database');
    }
    if (dbUser.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }
    return { ...decoded, dbUser };
  }
}
