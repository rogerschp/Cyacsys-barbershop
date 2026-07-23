import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { AssertLinkableMediaUseCase } from 'src/modules/media/use-cases/assert-linkable-media.use-case';
import { PROFESSIONAL_PROFILE_REPOSITORY } from 'src/modules/professional-profile/interfaces/professional-profile-repository.interface';
import { UpdateProfessionalProfileAvatarUseCase } from 'src/modules/professional-profile/use-cases/update-professional-profile-avatar.use-case';

describe('UpdateProfessionalProfileAvatarUseCase', () => {
  let useCase: UpdateProfessionalProfileAvatarUseCase;
  let profileRepo: {
    findByUserIdNonDeleted: jest.Mock;
    update: jest.Mock;
  };
  let assertLinkableMedia: { assertOwnedByUser: jest.Mock };

  const userId = 'user-1';
  const mediaId = 'media-1';
  const profileId = 'pp-1';

  beforeEach(async () => {
    profileRepo = {
      findByUserIdNonDeleted: jest
        .fn<
          () => Promise<{ id: string; userId: string; avatarMediaId: null }>
        >()
        .mockResolvedValue({
          id: profileId,
          userId,
          avatarMediaId: null,
        }),
      update: jest
        .fn<() => Promise<Record<string, unknown>>>()
        .mockResolvedValue({
          id: profileId,
          userId,
          avatarMediaId: mediaId,
          avatarMedia: { url: 'https://cdn.example/pro.png' },
          displayName: 'Pro',
          bio: null,
          professionalType: 'BARBER',
          bookingMode: 'DIRECT_BOOKING',
          whatsappNumber: null,
          instagramUsername: null,
          experienceYears: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    };
    assertLinkableMedia = {
      assertOwnedByUser: jest
        .fn<() => Promise<{ id: string }>>()
        .mockResolvedValue({ id: mediaId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfessionalProfileAvatarUseCase,
        {
          provide: PROFESSIONAL_PROFILE_REPOSITORY,
          useValue: profileRepo,
        },
        { provide: AssertLinkableMediaUseCase, useValue: assertLinkableMedia },
      ],
    }).compile();
    useCase = module.get(UpdateProfessionalProfileAvatarUseCase);
  });

  it('valida ownership AVATAR e persiste avatarMediaId', async () => {
    const result = await useCase.run(userId, mediaId);
    expect(assertLinkableMedia.assertOwnedByUser).toHaveBeenCalledWith({
      mediaId,
      currentUserId: userId,
      expectedType: MediaType.AVATAR,
    });
    expect(profileRepo.update).toHaveBeenCalledWith(profileId, userId, {
      avatarMediaId: mediaId,
    });
    expect(result.avatarMediaId).toBe(mediaId);
    expect(result.avatarUrl).toBe('https://cdn.example/pro.png');
  });
});
