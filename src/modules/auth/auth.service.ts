import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponseDto } from './dto/auth-login-reponse.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import { AUTH_PROVIDER, IAuthProvider } from './ports/auth-provider.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider,
  ) {}

  async authenticateWithUserCredentials(
    authLoginDto: AuthLoginDto,
  ): Promise<AuthLoginResponseDto> {
    return this.authProvider.authenticateWithCredentials(authLoginDto);
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
