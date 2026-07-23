import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { MediaPolicy } from 'src/modules/media/domain/media-policy';
import { StoragePathFactory } from 'src/modules/media/domain/storage-path/storage-path.factory';
import { MediaEntity } from 'src/modules/media/entities/media.entity';
import { MediaStatus } from 'src/modules/media/enums/media-status.enum';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { StorageProviderType } from 'src/modules/media/enums/storage-provider-type.enum';
import { MEDIA_REPOSITORY } from 'src/modules/media/interfaces/media-repository.interface';
import { STORAGE_PROVIDER } from 'src/modules/media/interfaces/storage-provider.interface';
import { UploadedMedia } from 'src/modules/media/interfaces/uploaded-media';
import { UploadMediaBinaryUseCase } from 'src/modules/media/use-cases/upload-media-binary.use-case';

describe('UploadMediaBinaryUseCase', () => {
  let useCase: UploadMediaBinaryUseCase;
  let storage: {
    upload: jest.Mock<(input: unknown) => Promise<UploadedMedia>>;
    delete: jest.Mock;
    getPublicUrl: jest.Mock;
  };
  let mediaRepository: {
    create: jest.Mock<(data: unknown) => Promise<Partial<MediaEntity>>>;
  };

  const tenantId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '550e8400-e29b-41d4-a716-446655440099';
  const buffer = Buffer.from('fake-image-bytes');

  beforeEach(async () => {
    storage = {
      upload: jest.fn<(input: unknown) => Promise<UploadedMedia>>(),
      delete: jest.fn(),
      getPublicUrl: jest.fn(),
    };
    mediaRepository = {
      create: jest.fn<(data: unknown) => Promise<Partial<MediaEntity>>>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadMediaBinaryUseCase,
        MediaPolicy,
        StoragePathFactory,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'media') {
                return { env: 'dev', storageProvider: 'cloudinary' };
              }
              if (key === 'MEDIA_ENV') return 'dev';
              return undefined;
            },
          },
        },
        { provide: STORAGE_PROVIDER, useValue: storage },
        { provide: MEDIA_REPOSITORY, useValue: mediaRepository },
      ],
    }).compile();

    useCase = module.get(UploadMediaBinaryUseCase);
  });

  it('faz upload e persiste AVAILABLE com checksum', async () => {
    storage.upload.mockResolvedValue({
      providerResourceId: 'dev/tenants/x/logo/abc',
      providerAssetId: 'asset-1',
      url: 'https://cdn.example/logo.jpg',
      provider: StorageProviderType.CLOUDINARY,
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: buffer.length,
      width: 100,
      height: 80,
    });
    mediaRepository.create.mockImplementation(async (data: unknown) => ({
      id: 'media-1',
      ...(data as object),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await useCase.run(
      {
        buffer,
        mimetype: 'image/jpeg',
        originalname: 'logo.jpg',
        size: buffer.length,
      },
      { mediaType: MediaType.LOGO, tenantId },
      userId,
    );

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        storagePath: `dev/tenants/${tenantId}/logo`,
      }),
    );
    expect(mediaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MediaStatus.AVAILABLE,
        checksum: createHash('sha256').update(buffer).digest('hex'),
        tenantId,
        createdByUserId: userId,
      }),
    );
    expect(result.status).toBe(MediaStatus.AVAILABLE);
    expect(result.id).toBe('media-1');
  });

  it('falha sem arquivo', async () => {
    await expect(
      useCase.run(undefined, { mediaType: MediaType.LOGO, tenantId }, userId),
    ).rejects.toThrow(BusinessRuleException);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('não persiste se storage falhar', async () => {
    storage.upload.mockRejectedValue(
      new BusinessRuleException('MEDIA_UPLOAD_FAILED', 'boom') as never,
    );
    await expect(
      useCase.run(
        {
          buffer,
          mimetype: 'image/png',
          originalname: 'x.png',
          size: buffer.length,
        },
        { mediaType: MediaType.LOGO, tenantId },
        userId,
      ),
    ).rejects.toThrow(BusinessRuleException);
    expect(mediaRepository.create).not.toHaveBeenCalled();
  });
});
