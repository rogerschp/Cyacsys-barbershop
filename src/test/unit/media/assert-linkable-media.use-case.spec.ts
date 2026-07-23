import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';
import { MediaEntity } from 'src/modules/media/entities/media.entity';
import { MediaStatus } from 'src/modules/media/enums/media-status.enum';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { MEDIA_REPOSITORY } from 'src/modules/media/interfaces/media-repository.interface';
import { AssertLinkableMediaUseCase } from 'src/modules/media/use-cases/assert-linkable-media.use-case';

describe('AssertLinkableMediaUseCase', () => {
  let useCase: AssertLinkableMediaUseCase;
  let mediaRepository: {
    findById: jest.MockedFunction<(id: string) => Promise<MediaEntity | null>>;
  };

  const mediaId = '550e8400-e29b-41d4-a716-446655440010';
  const userId = '550e8400-e29b-41d4-a716-446655440001';
  const tenantId = '550e8400-e29b-41d4-a716-446655440002';

  function baseMedia(overrides: Partial<MediaEntity> = {}): MediaEntity {
    return {
      id: mediaId,
      mediaType: MediaType.USER_AVATAR,
      status: MediaStatus.AVAILABLE,
      createdByUserId: userId,
      tenantId: null,
      ...overrides,
    } as MediaEntity;
  }

  beforeEach(async () => {
    mediaRepository = {
      findById: jest.fn<(id: string) => Promise<MediaEntity | null>>(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssertLinkableMediaUseCase,
        { provide: MEDIA_REPOSITORY, useValue: mediaRepository },
      ],
    }).compile();
    useCase = module.get(AssertLinkableMediaUseCase);
  });

  it('assertOwnedByUser retorna media quando ownership e tipo ok', async () => {
    mediaRepository.findById.mockResolvedValue(baseMedia());
    const media = await useCase.assertOwnedByUser({
      mediaId,
      currentUserId: userId,
      expectedType: MediaType.USER_AVATAR,
    });
    expect(media.id).toBe(mediaId);
  });

  it('assertOwnedByUser 404 quando media não existe', async () => {
    mediaRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.assertOwnedByUser({
        mediaId,
        currentUserId: userId,
        expectedType: MediaType.USER_AVATAR,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('assertOwnedByUser 403 quando createdByUserId diverge', async () => {
    mediaRepository.findById.mockResolvedValue(
      baseMedia({ createdByUserId: 'other-user' }),
    );
    await expect(
      useCase.assertOwnedByUser({
        mediaId,
        currentUserId: userId,
        expectedType: MediaType.USER_AVATAR,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertOwnedByUser 400 MEDIA_TYPE_MISMATCH', async () => {
    mediaRepository.findById.mockResolvedValue(
      baseMedia({ mediaType: MediaType.LOGO }),
    );
    await expect(
      useCase.assertOwnedByUser({
        mediaId,
        currentUserId: userId,
        expectedType: MediaType.USER_AVATAR,
      }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('assertOwnedByUser 400 MEDIA_NOT_AVAILABLE', async () => {
    mediaRepository.findById.mockResolvedValue(
      baseMedia({ status: MediaStatus.FAILED }),
    );
    await expect(
      useCase.assertOwnedByUser({
        mediaId,
        currentUserId: userId,
        expectedType: MediaType.USER_AVATAR,
      }),
    ).rejects.toBeInstanceOf(BusinessRuleException);
  });

  it('assertOwnedByTenant ok quando tenantId bate', async () => {
    mediaRepository.findById.mockResolvedValue(
      baseMedia({
        mediaType: MediaType.LOGO,
        tenantId,
        createdByUserId: userId,
      }),
    );
    const media = await useCase.assertOwnedByTenant({
      mediaId,
      tenantId,
      expectedType: MediaType.LOGO,
    });
    expect(media.tenantId).toBe(tenantId);
  });

  it('assertOwnedByTenant 403 quando tenantId diverge', async () => {
    mediaRepository.findById.mockResolvedValue(
      baseMedia({
        mediaType: MediaType.LOGO,
        tenantId: 'other-tenant',
      }),
    );
    await expect(
      useCase.assertOwnedByTenant({
        mediaId,
        tenantId,
        expectedType: MediaType.LOGO,
      }),
    ).rejects.toBeInstanceOf(TenantForbiddenException);
  });
});
