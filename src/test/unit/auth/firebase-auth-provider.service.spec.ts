import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { FirebaseAuthProvider } from 'src/modules/auth/providers/firebase/firebase-auth-provider.service';

jest.mock('axios');
jest.mock('firebase-admin', () => ({
    auth: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FirebaseAuthProvider', () => {
    let provider: FirebaseAuthProvider;
    let revokeRefreshTokens: jest.Mock;

    beforeEach(() => {
        process.env.API_KEY = 'test-api-key';
        mockedAxios.post.mockReset();
        revokeRefreshTokens = jest.fn();
        (admin.auth as jest.Mock).mockReturnValue({
            revokeRefreshTokens,
        });
        provider = new FirebaseAuthProvider();
    });

    afterEach(() => {
        delete process.env.API_KEY;
    });

    describe('getApiKey', () => {
        it('lança se API_KEY não está definida', () => {
            delete process.env.API_KEY;
            const p = new FirebaseAuthProvider();
            expect(() => (p as any).getApiKey()).toThrow('API_KEY is not set');
        });
    });

    it('getFirebaseErrorMessage retorna fallback para valor não-Error quando não é Axios', () => {
        expect((provider as any).getFirebaseErrorMessage({ notAnError: true })).toBe(
            'Authentication failed',
        );
    });

    describe('getFirebaseErrorMessage', () => {
        let isAxiosSpy: jest.SpyInstance;

        beforeEach(() => {
            isAxiosSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        });

        afterEach(() => {
            isAxiosSpy.mockRestore();
        });

        it('retorna message de Axios com FirebaseErrorResponse', () => {
            const err = {
                response: { data: { error: { message: 'EMAIL_NOT_FOUND' } } },
                message: 'req failed',
            };
            expect((provider as any).getFirebaseErrorMessage(err)).toBe('EMAIL_NOT_FOUND');
        });

        it('usa error.error.message aninhado', () => {
            const err = {
                response: { data: { error: { error: { message: 'nested' } } } },
                message: 'm',
            };
            expect((provider as any).getFirebaseErrorMessage(err)).toBe('nested');
        });

        it('fallback para Error.message', () => {
            expect((provider as any).getFirebaseErrorMessage(new Error('plain'))).toBe('plain');
        });

        it('usa data.message quando não há error.message aninhado', () => {
            const err = {
                response: { data: { message: 'direct' } },
                message: 'axios-msg',
            };
            expect((provider as any).getFirebaseErrorMessage(err)).toBe('direct');
        });

        it('cai em error.message quando payload Firebase vazio', () => {
            const err = {
                response: { data: {} },
                message: 'axios-fallback',
            };
            expect((provider as any).getFirebaseErrorMessage(err)).toBe('axios-fallback');
        });
    });

    describe('parseExpiresIn', () => {
        it('usa default quando undefined', () => {
            expect((provider as any).parseExpiresIn(undefined, 3600)).toBe(3600);
        });

        it('usa default quando null', () => {
            expect((provider as any).parseExpiresIn(null, 3600)).toBe(3600);
        });

        it('parseia string numérica', () => {
            expect((provider as any).parseExpiresIn('7200', 3600)).toBe(7200);
        });

        it('aceita número', () => {
            expect((provider as any).parseExpiresIn(900, 3600)).toBe(900);
        });
    });

    describe('authenticateWithCredentials', () => {
        it('retorna tokens quando login OK', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    idToken: 'id',
                    refreshToken: 'ref',
                    expiresIn: '1800',
                },
            });
            const res = await provider.authenticateWithCredentials({
                email: 'a@b.com',
                password: 'x',
            } as any);
            expect(res).toEqual({
                idToken: 'id',
                refreshToken: 'ref',
                expiresIn: 1800,
            });
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('signInWithPassword'),
                expect.objectContaining({ email: 'a@b.com', password: 'x', returnSecureToken: true }),
                expect.any(Object),
            );
        });

        it('lança UnauthorizedException quando login falha', async () => {
            mockedAxios.post.mockRejectedValue(new Error('network'));
            await expect(
                provider.authenticateWithCredentials({ email: 'a@b.com', password: 'x' } as any),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });

    describe('refreshToken', () => {
        it('retorna tokens quando refresh OK', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    id_token: 'new-id',
                    refresh_token: 'new-ref',
                    expires_in: 3600,
                },
            });
            const res = await provider.refreshToken({ refreshToken: 'old' } as any);
            expect(res).toEqual({
                idToken: 'new-id',
                refreshToken: 'new-ref',
                expiresIn: 3600,
            });
        });

        it('reusa refresh token do DTO quando resposta não traz refresh_token', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    id_token: 'id-only',
                    expires_in: '60',
                },
            });
            const res = await provider.refreshToken({ refreshToken: 'keep-me' } as any);
            expect(res.refreshToken).toBe('keep-me');
            expect(res.expiresIn).toBe(60);
        });

        it('lança quando id_token ausente', async () => {
            mockedAxios.post.mockResolvedValue({ data: {} });
            await expect(provider.refreshToken({ refreshToken: 'r' } as any)).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('propaga UnauthorizedException interna', async () => {
            const ex = new UnauthorizedException('x');
            mockedAxios.post.mockRejectedValue(ex);
            await expect(provider.refreshToken({ refreshToken: 'r' } as any)).rejects.toBe(ex);
        });
    });

    describe('revokeRefreshTokens', () => {
        it('resolve quando revoke OK', async () => {
            revokeRefreshTokens.mockResolvedValue(undefined);
            await expect(provider.revokeRefreshTokens('uid-1')).resolves.toBeUndefined();
        });

        it('lança UnauthorizedException quando revoke falha', async () => {
            revokeRefreshTokens.mockRejectedValue(new Error('fb'));
            await expect(provider.revokeRefreshTokens('uid')).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});
