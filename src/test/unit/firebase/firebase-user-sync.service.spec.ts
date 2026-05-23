import { ConflictException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseUserSyncService } from 'src/modules/firebase/firebase-user-sync.service';

jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}));

describe('FirebaseUserSyncService', () => {
  let service: FirebaseUserSyncService;
  let createUser: jest.Mock;
  let getUser: jest.Mock;
  let updateUser: jest.Mock;

  beforeEach(() => {
    createUser = jest.fn();
    getUser = jest.fn();
    updateUser = jest.fn();
    (admin.auth as jest.Mock).mockReturnValue({
      createUser,
      getUser,
      updateUser,
    });
    service = new FirebaseUserSyncService();
  });

  describe('createUser', () => {
    it('retorna uid quando cria usuário', async () => {
      createUser.mockResolvedValue({ uid: 'firebase-uid' });
      const res = await service.createUser({
        email: 'a@b.com',
        password: 'secret',
      });
      expect(res).toEqual({ uid: 'firebase-uid' });
      expect(createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'a@b.com',
          password: 'secret',
        }),
      );
    });

    it('lança ConflictException quando email já existe (código)', async () => {
      createUser.mockRejectedValue({ code: 'auth/email-already-exists' });
      await expect(
        service.createUser({ email: 'a@b.com', password: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lança ConflictException quando mensagem indica email em uso', async () => {
      createUser.mockRejectedValue(new Error('email already exists'));
      await expect(
        service.createUser({ email: 'a@b.com', password: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('relança erro desconhecido', async () => {
      const err = new Error('other');
      createUser.mockRejectedValue(err);
      await expect(
        service.createUser({ email: 'a@b.com', password: 'x' }),
      ).rejects.toBe(err);
    });
  });

  describe('getUser', () => {
    it('mapeia registro do Firebase', async () => {
      getUser.mockResolvedValue({
        uid: 'u1',
        email: 'e@e.com',
        displayName: 'Name',
      });
      await expect(service.getUser('u1')).resolves.toEqual({
        uid: 'u1',
        email: 'e@e.com',
        displayName: 'Name',
      });
    });
  });

  describe('updateUser', () => {
    it('não chama Firebase quando payload vazio', async () => {
      await service.updateUser('u1', {});
      expect(updateUser).not.toHaveBeenCalled();
    });

    it('aplica updates e resolve', async () => {
      updateUser.mockResolvedValue(undefined);
      await service.updateUser('u1', { disabled: true, displayName: 'X' });
      expect(updateUser).toHaveBeenCalledWith('u1', {
        disabled: true,
        displayName: 'X',
      });
    });

    it('relança erro do Firebase', async () => {
      const err = new Error('fail');
      updateUser.mockRejectedValue(err);
      await expect(service.updateUser('u1', { email: 'n@n.com' })).rejects.toBe(
        err,
      );
    });
  });

  describe('disableInFirebase', () => {
    it('delega para updateUser com disabled true', async () => {
      updateUser.mockResolvedValue(undefined);
      await service.disableInFirebase('u1');
      expect(updateUser).toHaveBeenCalledWith('u1', { disabled: true });
    });
  });
});
