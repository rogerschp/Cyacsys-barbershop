import { Test, TestingModule } from '@nestjs/testing';
import { FIREBASE_USER_SYNC } from 'src/modules/firebase/interfaces/firebase-user-sync.interface';
import { UserSyncService } from 'src/modules/user/infrastructure/user-sync.service';
import { USER_REPOSITORY } from 'src/modules/user/interfaces/user-repository.interface';
import { UserEntity } from 'src/modules/user/entities/user.entity';

describe('UserSyncService', () => {
  let service: UserSyncService;
  let repo: {
    findByFirebaseUid: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };
  let firebase: {
    getUser: jest.Mock;
    updateUser: jest.Mock;
    createUser: jest.Mock;
    disableInFirebase: jest.Mock;
  };

  const dbUser: UserEntity = {
    id: 'db-1',
    email: 'old@b.com',
    name: 'Old',
    firebaseUid: 'fb-1',
  } as UserEntity;

  beforeEach(async () => {
    repo = {
      findByFirebaseUid: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    firebase = {
      getUser: jest.fn(),
      updateUser: jest.fn(),
      createUser: jest.fn(),
      disableInFirebase: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSyncService,
        { provide: USER_REPOSITORY, useValue: repo },
        { provide: FIREBASE_USER_SYNC, useValue: firebase },
      ],
    }).compile();
    service = module.get(UserSyncService);
  });

  describe('syncFromFirebase', () => {
    it('retorna null quando usuário não existe no DB', async () => {
      repo.findByFirebaseUid.mockResolvedValue(null);
      await expect(service.syncFromFirebase('fb')).resolves.toBeNull();
      expect(firebase.getUser).not.toHaveBeenCalled();
    });

    it('retorna dbUser sem update quando Firebase alinhado', async () => {
      repo.findByFirebaseUid.mockResolvedValue({ ...dbUser });
      firebase.getUser.mockResolvedValue({
        uid: 'fb-1',
        email: 'old@b.com',
        displayName: 'Old',
      });
      const res = await service.syncFromFirebase('fb-1');
      expect(res).toMatchObject({ id: 'db-1' });
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('atualiza email e nome quando Firebase diverge', async () => {
      repo.findByFirebaseUid.mockResolvedValue({ ...dbUser });
      firebase.getUser.mockResolvedValue({
        uid: 'fb-1',
        email: 'new@b.com',
        displayName: 'New',
      });
      repo.update.mockResolvedValue(undefined);
      repo.findById.mockResolvedValue({
        ...dbUser,
        email: 'new@b.com',
        name: 'New',
      });
      const res = await service.syncFromFirebase('fb-1');
      expect(repo.update).toHaveBeenCalledWith('db-1', {
        email: 'new@b.com',
        name: 'New',
      });
      expect(res?.email).toBe('new@b.com');
    });

    it('em erro do Firebase retorna dbUser original (não propaga)', async () => {
      repo.findByFirebaseUid.mockResolvedValue({ ...dbUser });
      firebase.getUser.mockRejectedValue(new Error('network'));
      await expect(service.syncFromFirebase('fb-1')).resolves.toMatchObject({
        id: 'db-1',
      });
    });
  });

  describe('syncToFirebase', () => {
    it('não chama Firebase com payload vazio', async () => {
      await service.syncToFirebase('fb-1', {});
      expect(firebase.updateUser).not.toHaveBeenCalled();
    });

    it('delega updateUser', async () => {
      await service.syncToFirebase('fb-1', { displayName: 'X' });
      expect(firebase.updateUser).toHaveBeenCalledWith('fb-1', {
        displayName: 'X',
      });
    });
  });

  describe('createInFirebase / disableInFirebase', () => {
    it('delega createUser', async () => {
      firebase.createUser.mockResolvedValue({ uid: 'u' });
      await expect(
        service.createInFirebase({ email: 'a@b.com', password: 'p' } as any),
      ).resolves.toEqual({ uid: 'u' });
    });

    it('delega disableInFirebase', async () => {
      await service.disableInFirebase('fb-1');
      expect(firebase.disableInFirebase).toHaveBeenCalledWith('fb-1');
    });
  });
});
