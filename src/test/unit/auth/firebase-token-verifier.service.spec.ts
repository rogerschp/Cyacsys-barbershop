import { UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseTokenVerifier } from 'src/modules/auth/providers/firebase/firebase-token-verifier.service';

jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}));

describe('FirebaseTokenVerifier', () => {
  let verifier: FirebaseTokenVerifier;
  let verifyIdToken: jest.Mock;

  beforeEach(() => {
    verifyIdToken = jest.fn();
    (admin.auth as jest.Mock).mockReturnValue({
      verifyIdToken,
    });
    verifier = new FirebaseTokenVerifier();
  });

  it('retorna payload quando verifyIdToken resolve', async () => {
    const decoded = { uid: 'u1', email: 'a@b.com' };
    verifyIdToken.mockResolvedValue(decoded);
    await expect(verifier.verifyIdToken('tok')).resolves.toEqual(decoded);
    expect(verifyIdToken).toHaveBeenCalledWith('tok');
  });

  it('lança UnauthorizedException quando Firebase falha', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid'));
    await expect(verifier.verifyIdToken('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('propaga UnauthorizedException já lançada', async () => {
    const ex = new UnauthorizedException('custom');
    verifyIdToken.mockRejectedValue(ex);
    await expect(verifier.verifyIdToken('x')).rejects.toBe(ex);
  });
});
