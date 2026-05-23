import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import { ValidateUserAccessUseCase } from '../user/use-cases/validate-user-access.use-case';
import { SyncUserWithFirebaseUseCase } from '../user/use-cases/sync-user-with-firebase.use-case';
@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider,
    @Inject(TOKEN_VERIFIER)
    private readonly tokenVerifier: ITokenVerifier,
    private readonly validateUserAccessUseCase: ValidateUserAccessUseCase,
    private readonly syncUserWithFirebaseUseCase: SyncUserWithFirebaseUseCase,
  ) {}
  async authenticateWithUserCredentials(
    authLoginDto: AuthLoginDto,
  ): Promise<AuthLoginResponseDto> {
    const tokens =
      await this.authProvider.authenticateWithCredentials(authLoginDto);
    const decoded = await this.tokenVerifier.verifyIdToken(tokens.idToken);
    const user = await this.validateUserAccessUseCase.run(decoded.uid);
    await this.syncUserWithFirebaseUseCase.run(decoded.uid);
    return {
      ...tokens,
      username: user.name,
    };
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
