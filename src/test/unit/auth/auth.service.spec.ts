import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import { AUTH_PROVIDER } from 'src/modules/auth/interfaces/auth-provider.interface';
import { TOKEN_VERIFIER } from 'src/modules/auth/interfaces/token-verifier.interface';
import { UserService } from 'src/modules/user/user.service';

describe('AuthService', () => {
  let service: AuthService;
  let authProvider: {
    authenticateWithCredentials: jest.Mock;
    refreshToken: jest.Mock;
    revokeRefreshTokens: jest.Mock;
  };
  let tokenVerifier: { verifyIdToken: jest.Mock };
  let userService: {
    validateUserExists: jest.Mock;
    syncUserWithFirebase: jest.Mock;
  };

  const mockTokens = {
    idToken: 'id-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 3600,
  };

  const mockDecoded = { uid: 'firebase-uid-1', email: 'user@email.com' };

  beforeEach(async () => {
    authProvider = {
      authenticateWithCredentials: jest.fn().mockResolvedValue(mockTokens),
      refreshToken: jest.fn().mockResolvedValue(mockTokens),
      revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
    };
    tokenVerifier = {
      verifyIdToken: jest.fn().mockResolvedValue(mockDecoded),
    };
    userService = {
      validateUserExists: jest.fn().mockResolvedValue({ id: 'user-uuid' }),
      syncUserWithFirebase: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_PROVIDER, useValue: authProvider },
        { provide: TOKEN_VERIFIER, useValue: tokenVerifier },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('authenticateWithUserCredentials', () => {
    it('deve retornar tokens quando credenciais validas e usuario existe no banco', async () => {
      const dto = { email: 'user@email.com', password: 'senha123' };

      const result = await service.authenticateWithUserCredentials(dto);

      expect(authProvider.authenticateWithCredentials).toHaveBeenCalledWith(
        dto,
      );
      expect(tokenVerifier.verifyIdToken).toHaveBeenCalledWith(
        mockTokens.idToken,
      );
      expect(userService.validateUserExists).toHaveBeenCalledWith(
        mockDecoded.uid,
      );
      expect(userService.syncUserWithFirebase).toHaveBeenCalledWith(
        mockDecoded.uid,
      );
      expect(result).toEqual(mockTokens);
    });

    it('deve propagar ForbiddenException quando usuario nao existe no banco', async () => {
      userService.validateUserExists.mockRejectedValue(
        new ForbiddenException('User not found in database'),
      );

      await expect(
        service.authenticateWithUserCredentials({
          email: 'user@email.com',
          password: 'senha123',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(userService.syncUserWithFirebase).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('deve retornar tokens quando refresh token valido', async () => {
      const dto = { refreshToken: 'refresh-123' };

      const result = await service.refreshToken(dto);

      expect(authProvider.refreshToken).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });

    it('deve lancar BadRequestException quando refresh token ausente', async () => {
      await expect(service.refreshToken({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('deve chamar revokeRefreshTokens com o uid', async () => {
      await service.logout('firebase-uid-1');

      expect(authProvider.revokeRefreshTokens).toHaveBeenCalledWith(
        'firebase-uid-1',
      );
    });
  });
});
