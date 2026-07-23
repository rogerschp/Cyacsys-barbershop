import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MediaController } from 'src/modules/media/controllers/media.controller';
import { UploadMediaBinaryUseCase } from 'src/modules/media/use-cases/upload-media-binary.use-case';
import { CreateMediaUseCase } from 'src/modules/media/use-cases/create-media.use-case';
import { FindMediaByIdUseCase } from 'src/modules/media/use-cases/find-media-by-id.use-case';
import { DeleteMediaUseCase } from 'src/modules/media/use-cases/delete-media.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { MediaStatus } from 'src/modules/media/enums/media-status.enum';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { StorageProviderType } from 'src/modules/media/enums/storage-provider-type.enum';
import { MediaVisibility } from 'src/modules/media/enums/media-visibility.enum';
import { MediaAccessLevel } from 'src/modules/media/enums/media-access-level.enum';

describe('MediaController (HTTP)', () => {
  let app: INestApplication;
  let appWithoutUser: INestApplication;
  let findUseCase: { run: jest.Mock };
  let deleteUseCase: { run: jest.Mock };
  let createUseCase: { run: jest.Mock };
  let uploadUseCase: { run: jest.Mock };
  let findUseCaseNoUser: { run: jest.Mock };
  let createUseCaseNoUser: { run: jest.Mock };
  let uploadUseCaseNoUser: { run: jest.Mock };

  const mockMedia = {
    id: 'media-uuid',
    provider: StorageProviderType.CLOUDINARY,
    providerResourceId: 'pub/1',
    providerAssetId: 'asset-1',
    storagePath: 'tenants/t/logo',
    url: 'https://cdn.example/1.jpg',
    checksum: null,
    originalFileName: 'a.jpg',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    size: 10,
    width: 1,
    height: 1,
    mediaType: MediaType.LOGO,
    visibility: MediaVisibility.PUBLIC,
    accessLevel: MediaAccessLevel.PUBLIC,
    status: MediaStatus.AVAILABLE,
    failureReason: null,
    tenantId: 'tenant-1',
    createdByUserId: 'user-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeAll(async () => {
    uploadUseCase = { run: jest.fn() };
    createUseCase = { run: jest.fn() };
    findUseCase = { run: jest.fn() };
    deleteUseCase = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: UploadMediaBinaryUseCase, useValue: uploadUseCase },
        { provide: CreateMediaUseCase, useValue: createUseCase },
        { provide: FindMediaByIdUseCase, useValue: findUseCase },
        { provide: DeleteMediaUseCase, useValue: deleteUseCase },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-1' } };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    uploadUseCaseNoUser = { run: jest.fn() };
    createUseCaseNoUser = { run: jest.fn() };
    findUseCaseNoUser = { run: jest.fn() };

    const withoutUserModule: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: UploadMediaBinaryUseCase, useValue: uploadUseCaseNoUser },
        { provide: CreateMediaUseCase, useValue: createUseCaseNoUser },
        { provide: FindMediaByIdUseCase, useValue: findUseCaseNoUser },
        { provide: DeleteMediaUseCase, useValue: { run: jest.fn() } },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { uid: 'fb' };
          return true;
        },
      })
      .compile();

    appWithoutUser = withoutUserModule.createNestApplication();
    await appWithoutUser.init();
  });

  afterAll(async () => {
    await app.close();
    await appWithoutUser.close();
  });

  it('GET /media/:id', async () => {
    findUseCase.run.mockResolvedValue(mockMedia);
    const res = await request(app.getHttpServer())
      .get('/media/media-uuid')
      .expect(200);
    expect(res.body.id).toBe('media-uuid');
    expect(findUseCase.run).toHaveBeenCalledWith('media-uuid');
  });

  it('DELETE /media/:id', async () => {
    deleteUseCase.run.mockResolvedValue({
      ...mockMedia,
      status: MediaStatus.DELETED,
    });
    const res = await request(app.getHttpServer())
      .delete('/media/media-uuid')
      .expect(200);
    expect(res.body.status).toBe(MediaStatus.DELETED);
  });

  it('POST /media registra sem binary', async () => {
    createUseCase.run.mockResolvedValue(mockMedia);
    await request(app.getHttpServer())
      .post('/media')
      .send({
        mediaType: MediaType.LOGO,
        provider: StorageProviderType.CLOUDINARY,
        providerResourceId: 'pub/1',
        mimeType: 'image/jpeg',
        extension: 'jpg',
        size: 10,
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      })
      .expect(201);
    expect(createUseCase.run).toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: MediaType.LOGO }),
      'user-1',
    );
  });

  it('POST /media/upload delega ao use case', async () => {
    uploadUseCase.run.mockResolvedValue(mockMedia);
    await request(app.getHttpServer())
      .post('/media/upload')
      .field('mediaType', MediaType.LOGO)
      .field('tenantId', '550e8400-e29b-41d4-a716-446655440000')
      .attach('file', Buffer.from('abc'), {
        filename: 'logo.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);
    expect(uploadUseCase.run).toHaveBeenCalled();
  });

  it('POST /media retorna 404 sem dbUser', async () => {
    await request(appWithoutUser.getHttpServer())
      .post('/media')
      .send({
        mediaType: MediaType.LOGO,
        provider: StorageProviderType.CLOUDINARY,
        providerResourceId: 'pub/1',
        mimeType: 'image/jpeg',
        extension: 'jpg',
        size: 10,
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      })
      .expect(404);
  });

  it('POST /media/upload retorna 404 sem dbUser', async () => {
    await request(appWithoutUser.getHttpServer())
      .post('/media/upload')
      .field('mediaType', MediaType.LOGO)
      .field('tenantId', '550e8400-e29b-41d4-a716-446655440000')
      .attach('file', Buffer.from('abc'), 'logo.jpg')
      .expect(404);
  });
});
