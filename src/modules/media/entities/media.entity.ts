import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MediaAccessLevel } from '../enums/media-access-level.enum';
import { MediaStatus } from '../enums/media-status.enum';
import { MediaType } from '../enums/media-type.enum';
import { MediaVisibility } from '../enums/media-visibility.enum';
import { StorageProviderType } from '../enums/storage-provider-type.enum';

@Entity('media')
@Index('IDX_media_tenant_id', ['tenantId'])
@Index('IDX_media_created_by_user_id', ['createdByUserId'])
@Index('IDX_media_checksum', ['checksum'])
export class MediaEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({
    type: 'enum',
    enum: StorageProviderType,
  })
  provider: StorageProviderType;

  @Column({ name: 'provider_resource_id', type: 'varchar', length: 512 })
  @ApiProperty({ description: 'Cloudinary public_id / S3 object key' })
  providerResourceId: string;

  @Column({
    name: 'provider_asset_id',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  @ApiProperty({
    nullable: true,
    description: 'Cloudinary asset_id (stable) / future S3 version id',
  })
  providerAssetId: string | null;

  @Column({ name: 'storage_path', type: 'varchar', length: 512 })
  @ApiProperty({
    example: 'tenants/uuid/logo',
    description: 'Logical path built by backend StoragePathFactory',
  })
  storagePath: string;

  @Column({ type: 'varchar', length: 2048 })
  @ApiProperty({ description: 'Cached public URL; regenerate via provider' })
  url: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @ApiProperty({
    nullable: true,
    description: 'SHA-256 hex of binary; null when imported without buffer',
  })
  checksum: string | null;

  @Column({
    name: 'original_file_name',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  originalFileName: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 128 })
  mimeType: string;

  @Column({ type: 'varchar', length: 32 })
  extension: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: MediaType,
  })
  mediaType: MediaType;

  @Column({ type: 'enum', enum: MediaVisibility })
  visibility: MediaVisibility;

  @Column({
    name: 'access_level',
    type: 'enum',
    enum: MediaAccessLevel,
  })
  accessLevel: MediaAccessLevel;

  @Column({ type: 'enum', enum: MediaStatus })
  status: MediaStatus;

  @Column({
    name: 'failure_reason',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  failureReason: string | null;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
