import { AuthLoginDto } from '../dto/auth-login.dto';
import { AuthLoginResponseDto } from '../dto/auth-login-reponse.dto';
import { AuthRefreshDto } from '../dto/auth-refresh.dto';
import { AuthRefreshResponseDto } from '../dto/auth-refresh-response.dto';

export interface IAuthProvider {
  authenticateWithCredentials(dto: AuthLoginDto): Promise<AuthLoginResponseDto>;

  refreshToken(dto: AuthRefreshDto): Promise<AuthRefreshResponseDto>;

  revokeRefreshTokens(uid: string): Promise<void>;
}

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');
