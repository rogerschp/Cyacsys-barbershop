import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { FirebaseErrorResponse } from 'src/common/interfaces/firebaseErrorResponse.interface';
import { FirebaseRefreshTokenResponse } from 'src/common/interfaces/fireabaseRefreshTokenResponse.interface';
import { FirebaseSignInResponse } from 'src/common/interfaces/firebaseSignInResponse.interface';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { AuthLoginDto } from '../../dto/auth-login.dto';
import { AuthLoginResponseDto } from '../../dto/auth-login-response.dto';
import { AuthRefreshDto } from '../../dto/auth-refresh.dto';
import { AuthRefreshResponseDto } from '../../dto/auth-refresh-response.dto';
import { IAuthProvider } from '../../ports/auth-provider.interface';

const FIREBASE_SIGN_IN_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
const FIREBASE_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';
const DEFAULT_EXPIRES_IN_SECONDS = 3600;
const FALLBACK_ERROR_MESSAGE = 'Authentication failed';

@Injectable()
export class FirebaseAuthProvider implements IAuthProvider {
  private readonly logger = new Logger(FirebaseAuthProvider.name);

  private getApiKey(): string {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY is not set');
    }
    return apiKey;
  }

  private getFirebaseErrorMessage(error: unknown): string {
    if (!axios.isAxiosError(error) || !error.response?.data) {
      return error instanceof Error ? error.message : FALLBACK_ERROR_MESSAGE;
    }
    const data = error.response.data as FirebaseErrorResponse;
    return (
      data.error?.message ??
      data.error?.error?.message ??
      data.message ??
      error.message ??
      FALLBACK_ERROR_MESSAGE
    );
  }

  private parseExpiresIn(
    value: string | number | undefined,
    defaultValue: number,
  ): number {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return typeof value === 'string' ? parseInt(value, 10) : Number(value);
  }

  async authenticateWithCredentials(
    authLoginDto: AuthLoginDto,
  ): Promise<AuthLoginResponseDto> {
    const apiKey = this.getApiKey();
    const { email, password } = authLoginDto;

    try {
      const response = await axios.post<FirebaseSignInResponse>(
        `${FIREBASE_SIGN_IN_URL}?key=${apiKey}`,
        { email, password, returnSecureToken: true },
        { headers: { 'Content-Type': 'application/json' } },
      );
      const { idToken, refreshToken, expiresIn } = response.data;
      return {
        idToken,
        refreshToken,
        expiresIn: this.parseExpiresIn(expiresIn, DEFAULT_EXPIRES_IN_SECONDS),
      };
    } catch (error) {
      const errorMsg = this.getFirebaseErrorMessage(error);
      this.logger.warn(`Login failed: ${errorMsg}`);
      throw new UnauthorizedException(errorMsg);
    }
  }

  async refreshToken(
    refreshTokenDto: AuthRefreshDto,
  ): Promise<AuthRefreshResponseDto> {
    const apiKey = this.getApiKey();

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshTokenDto.refreshToken,
      });

      const response = await axios.post<FirebaseRefreshTokenResponse>(
        `${FIREBASE_TOKEN_URL}?key=${apiKey}`,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      const data = response.data;

      const idToken = data.id_token;
      if (!idToken) {
        throw new UnauthorizedException('Invalid refresh token response');
      }

      const refreshToken = data.refresh_token ?? refreshTokenDto.refreshToken;
      const expiresIn = this.parseExpiresIn(
        data.expires_in,
        DEFAULT_EXPIRES_IN_SECONDS,
      );

      return { idToken, refreshToken, expiresIn };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMsg = this.getFirebaseErrorMessage(error);
      this.logger.warn(`Refresh failed: ${errorMsg}`);
      throw new UnauthorizedException(errorMsg);
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      await admin.auth().revokeRefreshTokens(uid);
      this.logger.log(`Refresh tokens revoked for user ${uid}`);
    } catch (error) {
      this.logger.error(`Logout failed for user ${uid}`, error);
      throw new UnauthorizedException('Logout failed');
    }
  }
}
