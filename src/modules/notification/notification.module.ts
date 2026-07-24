import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRecordRepository } from '../../repository/notification/notification-record.repository';
import { NotificationRecordEntity } from './entities/notification-record.entity';
import { NOTIFICATION_PROVIDER } from './interfaces/notification-provider.interface';
import { NOTIFICATION_RECORD_REPOSITORY } from './interfaces/notification-record-repository.interface';
import { AwsSesNotificationProvider } from './providers/aws-ses-notification.provider';
import { MockNotificationProvider } from './providers/mock-notification.provider';
import { ResendNotificationProvider } from './providers/resend-notification.provider';
import { TelegramNotificationProvider } from './providers/telegram-notification.provider';
import { WhatsappNotificationProvider } from './providers/whatsapp-notification.provider';
import { NotificationRouter } from './routing/notification.router';
import { TemplateRenderer } from './templates/template.renderer';
import { DispatchNotificationUseCase } from './use-cases/dispatch-notification.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRecordEntity]),
    ConfigModule,
  ],
  providers: [
    NotificationRouter,
    TemplateRenderer,
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
    {
      provide: NOTIFICATION_PROVIDER,
      useFactory: (
        config: ConfigService,
        mock: MockNotificationProvider,
        resend: ResendNotificationProvider,
        ses: AwsSesNotificationProvider,
        telegram: TelegramNotificationProvider,
        whatsapp: WhatsappNotificationProvider,
      ) => {
        const provider = (
          config.get<string>('NOTIFICATION_PROVIDER') ?? 'mock'
        ).toLowerCase();
        switch (provider) {
          case 'resend':
            return resend;
          case 'ses':
          case 'aws_ses':
            return ses;
          case 'telegram':
            return telegram;
          case 'whatsapp':
            return whatsapp;
          case 'mock':
          default:
            return mock;
        }
      },
      inject: [
        ConfigService,
        MockNotificationProvider,
        ResendNotificationProvider,
        AwsSesNotificationProvider,
        TelegramNotificationProvider,
        WhatsappNotificationProvider,
      ],
    },
    DispatchNotificationUseCase,
  ],
  exports: [DispatchNotificationUseCase],
})
export class NotificationModule {}
