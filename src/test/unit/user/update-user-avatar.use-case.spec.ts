import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { AssertLinkableMediaUseCase } from 'src/modules/media/use-cases/assert-linkable-media.use-case';
import { USER_REPOSITORY } from 'src/modules/user/interfaces/user-repository.interface';
import { FindUserByIdUseCase } from 'src/modules/user/use-cases/find-user-by-id.use-case';
import { UpdateUserAvatarUseCase } from 'src/modules/user/use-cases/update-user-avatar.use-case';

describe('UpdateUserAvatarUseCase', () => {
  let useCase: UpdateUserAvatarUseCase;
  let userRepository: { findById: jest.Mock; update: jest.Mock };
  let assertLinkableMedia: { assertOwnedByUser: jest.Mock };
  let findUserByIdUseCase: { run: jest.Mock };

  const userId = 'user-1';
  const mediaId = 'media-1';

  beforeEach(async () => {
    userRepository = {
      findById: jest
        .fn<() => Promise<{ id: string } | null>>()
        .mockResolvedValue({
          id: userId,
        }),
      update: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    assertLinkableMedia = {
      assertOwnedByUser: jest
        .fn<() => Promise<{ id: string }>>()
        .mockResolvedValue({ id: mediaId }),
    };
    findUserByIdUseCase = {
      run: jest
        .fn<
          () => Promise<{
            id: string;
            avatarMediaId: string;
            avatarUrl: string;
          }>
        >()
        .mockResolvedValue({
          id: userId,
          avatarMediaId: mediaId,
          avatarUrl: 'https://cdn.example/a.png',
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserAvatarUseCase,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: AssertLinkableMediaUseCase, useValue: assertLinkableMedia },
        { provide: FindUserByIdUseCase, useValue: findUserByIdUseCase },
      ],
    }).compile();
    useCase = module.get(UpdateUserAvatarUseCase);
  });

  it('valida ownership USER_AVATAR e persiste avatarMediaId', async () => {
    const result = await useCase.run(userId, mediaId);
    expect(assertLinkableMedia.assertOwnedByUser).toHaveBeenCalledWith({
      mediaId,
      currentUserId: userId,
      expectedType: MediaType.USER_AVATAR,
    });
    expect(userRepository.update).toHaveBeenCalledWith(userId, {
      avatarMediaId: mediaId,
    });
    expect(result.avatarMediaId).toBe(mediaId);
  });
});
