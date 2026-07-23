import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaRepository } from 'src/repository/media/media.repository';
import { MediaEntity } from 'src/modules/media/entities/media.entity';
import { MediaAccessLevel } from 'src/modules/media/enums/media-access-level.enum';
import { MediaStatus } from 'src/modules/media/enums/media-status.enum';
import { MediaType } from 'src/modules/media/enums/media-type.enum';
import { MediaVisibility } from 'src/modules/media/enums/media-visibility.enum';
import { StorageProviderType } from 'src/modules/media/enums/storage-provider-type.enum';

describe('MediaRepository', () => {
  let repository: MediaRepository;
  let typeOrmRepo: jest.Mocked<Repository<MediaEntity>>;

  const base = {
    id: 'media-1',
    provider: StorageProviderType.CLOUDINARY,
    providerResourceId: 'pub/1',
    providerAssetId: null,
    storagePath: 'tenants/t/logo',
    url: 'https://cdn.example/1.jpg',
    checksum: 'abc',
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
  } as MediaEntity;

  beforeEach(async () => {
    const mockTypeOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaRepository,
        {
          provide: getRepositoryToken(MediaEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get(MediaRepository);
    typeOrmRepo = module.get(getRepositoryToken(MediaEntity));
  });

  it('create persiste defaults nulláveis', async () => {
    typeOrmRepo.create.mockReturnValue(base);
    typeOrmRepo.save.mockResolvedValue(base);

    await repository.create({
      provider: StorageProviderType.CLOUDINARY,
      providerResourceId: 'pub/1',
      storagePath: 'tenants/t/logo',
      url: 'https://cdn.example/1.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 10,
      mediaType: MediaType.LOGO,
      visibility: MediaVisibility.PUBLIC,
      accessLevel: MediaAccessLevel.PUBLIC,
      status: MediaStatus.AVAILABLE,
    });

    expect(typeOrmRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        providerAssetId: null,
        checksum: null,
        originalFileName: null,
        width: null,
        height: null,
        failureReason: null,
        tenantId: null,
        createdByUserId: null,
      }),
    );
  });

  it('create com campos opcionais preenchidos', async () => {
    typeOrmRepo.create.mockReturnValue(base);
    typeOrmRepo.save.mockResolvedValue(base);

    await repository.create({
      provider: StorageProviderType.CLOUDINARY,
      providerResourceId: 'pub/1',
      providerAssetId: 'asset',
      storagePath: 'tenants/t/logo',
      url: 'https://cdn.example/1.jpg',
      checksum: 'abc',
      originalFileName: 'a.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 10,
      width: 2,
      height: 3,
      mediaType: MediaType.LOGO,
      visibility: MediaVisibility.PUBLIC,
      accessLevel: MediaAccessLevel.PUBLIC,
      status: MediaStatus.AVAILABLE,
      failureReason: 'x',
      tenantId: 'tenant-1',
      createdByUserId: 'user-1',
    });

    expect(typeOrmRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        providerAssetId: 'asset',
        checksum: 'abc',
        width: 2,
        height: 3,
        tenantId: 'tenant-1',
      }),
    );
  });

  it('update aplica campos e relê', async () => {
    typeOrmRepo.findOne.mockResolvedValue({
      ...base,
      status: MediaStatus.DELETED,
    });

    const updated = await repository.update('media-1', {
      status: MediaStatus.DELETED,
      url: 'https://cdn.example/2.jpg',
      providerResourceId: 'pub/2',
      providerAssetId: 'a2',
      checksum: 'c2',
      width: 9,
      height: 8,
      failureReason: 'fail',
    });

    expect(typeOrmRepo.update).toHaveBeenCalledWith(
      'media-1',
      expect.objectContaining({
        status: MediaStatus.DELETED,
        url: 'https://cdn.example/2.jpg',
      }),
    );
    expect(updated.status).toBe(MediaStatus.DELETED);
  });

  it('update lança se não encontrar após update', async () => {
    typeOrmRepo.findOne.mockResolvedValue(null);
    await expect(
      repository.update('missing', { status: MediaStatus.FAILED }),
    ).rejects.toThrow('Media missing not found after update');
  });

  it('findById e findByChecksum', async () => {
    typeOrmRepo.findOne.mockResolvedValue(base);
    await expect(repository.findById('media-1')).resolves.toEqual(base);
    await expect(repository.findByChecksum('abc')).resolves.toEqual(base);
    expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
      where: { checksum: 'abc' },
      withDeleted: false,
    });
  });

  it('softDelete', async () => {
    await repository.softDelete('media-1');
    expect(typeOrmRepo.softDelete).toHaveBeenCalledWith('media-1');
  });
});
