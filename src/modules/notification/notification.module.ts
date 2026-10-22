import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRecordRepository } from '../../repository/notification/notification-record.repository';
import { UserEntity } from '../user/entities/user.entity';
import { NotificationChannel } from './domain/notification-channel.enum';
import { NotificationRecordEntity } from './entities/notification-record.entity';
import { NotificationLinkTokenEntity } from './entities/notification-link-token.entity';
import { UserDeviceTokenEntity } from './entities/user-device-token.entity';
import { UserNotificationPreferenceEntity } from './entities/user-notification-preference.entity';
import {
  INotificationProvider,
  NOTIFICATION_PROVIDERS,
} from './interfaces/notification-provider.interface';
import { NOTIFICATION_RECORD_REPOSITORY } from './interfaces/notification-record-repository.interface';
import { NotificationController } from './notification.controller';
import { AwsSesNotificationProvider } from './providers/aws-ses-notification.provider';
import { FcmNotificationProvider } from './providers/fcm-notification.provider';
import { MockNotificationProvider } from './providers/mock-notification.provider';
import { ResendNotificationProvider } from './providers/resend-notification.provider';
import { TelegramNotificationProvider } from './providers/telegram-notification.provider';
import { WhatsappNotificationProvider } from './providers/whatsapp-notification.provider';
import { NotificationRouter } from './routing/notification.router';
import { RecipientResolver } from './routing/recipient.resolver';
import { TemplateRenderer } from './templates/template.renderer';
import { DispatchNotificationUseCase } from './use-cases/dispatch-notification.use-case';
import { NotificationProcessorJob } from './use-cases/notification-processor.job';
import { NotificationSettingsService } from './use-cases/notification-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationRecordEntity,
      UserDeviceTokenEntity,
      UserNotificationPreferenceEntity,
      NotificationLinkTokenEntity,
      UserEntity,
    ]),
    ConfigModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationRouter,
    TemplateRenderer,
    RecipientResolver,
    NotificationRecordRepository,
    {
      provide: NOTIFICATION_RECORD_REPOSITORY,
      useClass: NotificationRecordRepository,
    },
    MockNotificationProvider,
    ResendNotificationProvider,
    AwsSesNotificationProvider,
    TelegramNotificationProvider,
    WhatsappNotificationProvider,
    FcmNotificationProvider,
    {
      provide: NOTIFICATION_PROVIDERS,
      useFactory: (
        config: ConfigService,
        mock: MockNotificationProvider,
        resend: ResendNotificationProvider,
        ses: AwsSesNotificationProvider,
        telegram: TelegramNotificationProvider,
        whatsapp: WhatsappNotificationProvider,
        fcm: FcmNotificationProvider,
      ) => {
        const emailProvider = (
          config.get<string>('NOTIFICATION_EMAIL_PROVIDER') ??
          config.get<string>('NOTIFICATION_PROVIDER') ??
          'mock'
        ).toLowerCase();
        const email: INotificationProvider =
          emailProvider === 'resend'
            ? resend
            : emailProvider === 'ses' || emailProvider === 'aws_ses'
              ? ses
              : mock;
        return new Map([
          [NotificationChannel.EMAIL, email],
          [NotificationChannel.TELEGRAM, telegram],
          [NotificationChannel.WHATSAPP, whatsapp],
          [NotificationChannel.PUSH, fcm],
        ]);
      },
      inject: [
        ConfigService,
        MockNotificationProvider,
        ResendNotificationProvider,
        AwsSesNotificationProvider,
        TelegramNotificationProvider,
        WhatsappNotificationProvider,
        FcmNotificationProvider,
      ],
    },
    DispatchNotificationUseCase,
    NotificationSettingsService,
    NotificationProcessorJob,
  ],
  exports: [DispatchNotificationUseCase],
})
export class NotificationModule {}
