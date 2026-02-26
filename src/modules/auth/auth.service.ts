import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { UserStatus } from '../user/entities/user-status.enum';
import { UserService } from '../user/user.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import { AUTH_PROVIDER, IAuthProvider } from './ports/auth-provider.interface';
import {
  TOKEN_VERIFIER,
  ITokenVerifier,
} from './ports/token-verifier.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider,
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: ITokenVerifier,
    private readonly userService: UserService,
  ) {}

  /**
   * Autentica com Firebase; em seguida garante que o usuário existe no banco (fonte da verdade)
   * e que está ACTIVE. Se inativo/suspenso, nega o login.
   */
  async authenticateWithUserCredentials(
    authLoginDto: AuthLoginDto,
  ): Promise<AuthLoginResponseDto> {
    const tokens =
      await this.authProvider.authenticateWithCredentials(authLoginDto);
    const decoded = await this.tokenVerifier.verifyIdToken(tokens.idToken);
    const email = decoded.email ?? authLoginDto.email ?? '';
    const user = await this.userService.findOrCreateFromFirebase(
      decoded.uid,
      email,
      (decoded as { name?: string }).name,
    );
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active. Access denied.');
    }
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
