import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import {
  AUTH_PROVIDER,
  IAuthProvider,
} from './interfaces/auth-provider.interface';
import {
  TOKEN_VERIFIER,
  ITokenVerifier,
} from './interfaces/token-verifier.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider,
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: ITokenVerifier,
    private readonly userService: UserService,
  ) {}

  /**
   * Autentica com Firebase; só aceita se o usuário existir no banco (criado pelo sistema)
   * e estiver ACTIVE. Em seguida sincroniza dados básicos Firebase → banco (email, name).
   */
  async authenticateWithUserCredentials(
    authLoginDto: AuthLoginDto,
  ): Promise<AuthLoginResponseDto> {
    const tokens =
      await this.authProvider.authenticateWithCredentials(authLoginDto);
    const decoded = await this.tokenVerifier.verifyIdToken(tokens.idToken);
    // Database is source of truth: validate user exists before allowing login
    await this.userService.validateUserExists(decoded.uid);
    await this.userService.syncUserWithFirebase(decoded.uid);
    return tokens;
  }

  async refreshToken(
    refreshTokenDto: AuthRefreshDto,
  ): Promise<AuthRefreshResponseDto> {
    if (!refreshTokenDto.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authProvider.refreshToken(refreshTokenDto);
  }

  async logout(uid: string): Promise<void> {
    await this.authProvider.revokeRefreshTokens(uid);
  }
}
