import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaEntity } from '../../modules/media/entities/media.entity';
import {
  CreateMediaData,
  IMediaRepository,
  UpdateMediaData,
} from '../../modules/media/interfaces/media-repository.interface';

@Injectable()
export class MediaRepository implements IMediaRepository {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly repo: Repository<MediaEntity>,
  ) {}

  async create(data: CreateMediaData): Promise<MediaEntity> {
    const entity = this.repo.create({
      provider: data.provider,
      providerResourceId: data.providerResourceId,
      providerAssetId: data.providerAssetId ?? null,
      storagePath: data.storagePath,
      url: data.url,
      checksum: data.checksum ?? null,
      originalFileName: data.originalFileName ?? null,
      mimeType: data.mimeType,
      extension: data.extension,
      size: data.size,
      width: data.width ?? null,
      height: data.height ?? null,
      mediaType: data.mediaType,
      visibility: data.visibility,
      accessLevel: data.accessLevel,
      status: data.status,
      failureReason: data.failureReason ?? null,
      tenantId: data.tenantId ?? null,
      createdByUserId: data.createdByUserId ?? null,
    });
    return this.repo.save(entity);
  }

  async update(id: string, data: UpdateMediaData): Promise<MediaEntity> {
    const payload: Partial<MediaEntity> = {};
    if (data.providerResourceId !== undefined) {
      payload.providerResourceId = data.providerResourceId;
    }
    if (data.providerAssetId !== undefined) {
      payload.providerAssetId = data.providerAssetId;
    }
    if (data.url !== undefined) payload.url = data.url;
    if (data.checksum !== undefined) payload.checksum = data.checksum;
    if (data.width !== undefined) payload.width = data.width;
    if (data.height !== undefined) payload.height = data.height;
    if (data.status !== undefined) payload.status = data.status;
    if (data.failureReason !== undefined) {
      payload.failureReason = data.failureReason;
    }
    await this.repo.update(id, payload);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Media ${id} not found after update`);
    }
    return updated;
  }

  async findById(id: string): Promise<MediaEntity | null> {
    return this.repo.findOne({ where: { id }, withDeleted: false });
  }

  async findByChecksum(checksum: string): Promise<MediaEntity | null> {
    return this.repo.findOne({
      where: { checksum },
      withDeleted: false,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
