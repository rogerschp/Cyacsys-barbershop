import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MediaRepository } from '../../repository/media/media.repository';
import { MediaController } from './controllers/media.controller';
import { MediaPolicy } from './domain/media-policy';
import { StoragePathFactory } from './domain/storage-path/storage-path.factory';
import { MediaEntity } from './entities/media.entity';
import { MEDIA_REPOSITORY } from './interfaces/media-repository.interface';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { AwsS3Provider } from './providers/aws/aws-s3.provider';
import { CloudinaryProvider } from './providers/cloudinary/cloudinary.provider';
import { CreateMediaUseCase } from './use-cases/create-media.use-case';
import { DeleteMediaUseCase } from './use-cases/delete-media.use-case';
import { FindMediaByIdUseCase } from './use-cases/find-media-by-id.use-case';
import { UploadMediaBinaryUseCase } from './use-cases/upload-media-binary.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaEntity]),
    ConfigModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [MediaController],
  providers: [
    MediaPolicy,
    StoragePathFactory,
    MediaRepository,
    { provide: MEDIA_REPOSITORY, useClass: MediaRepository },
    CloudinaryProvider,
    AwsS3Provider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        config: ConfigService,
        cloudinary: CloudinaryProvider,
        aws: AwsS3Provider,
      ) => {
        const provider = (
          config.get<string>('STORAGE_PROVIDER') ?? 'cloudinary'
        ).toLowerCase();
        if (provider === 'aws' || provider === 'aws_s3') {
          return aws;
        }
        return cloudinary;
      },
      inject: [ConfigService, CloudinaryProvider, AwsS3Provider],
    },
    UploadMediaBinaryUseCase,
    CreateMediaUseCase,
    FindMediaByIdUseCase,
    DeleteMediaUseCase,
  ],
  exports: [
    MEDIA_REPOSITORY,
    STORAGE_PROVIDER,
    UploadMediaBinaryUseCase,
    CreateMediaUseCase,
    FindMediaByIdUseCase,
    DeleteMediaUseCase,
  ],
})
export class MediaModule {}
