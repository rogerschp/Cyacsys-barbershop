import { createHash } from 'crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DispatchNotificationCommand,
  DispatchNotificationOptions,
} from '../domain/dispatch-notification.command';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationRecordStatus } from '../domain/notification-record-status.enum';
import { NotificationRecordEntity } from '../entities/notification-record.entity';
import {
  INotificationProvider,
  NOTIFICATION_PROVIDERS,
  NotificationProviderRegistry,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';
import {
  INotificationRecordRepository,
  NOTIFICATION_RECORD_REPOSITORY,
} from '../interfaces/notification-record-repository.interface';
import {
  INVALID_FCM_TOKEN_CODES,
  PushDeliveryError,
} from '../providers/fcm-notification.provider';
import { NotificationRouter } from '../routing/notification.router';
import { RecipientResolver } from '../routing/recipient.resolver';
import { TemplateRenderer } from '../templates/template.renderer';

export const MAX_ATTEMPTS = 3;
const backoffMs = (attempts: number) =>
  Math.min(60, 5 * 2 ** Math.max(0, attempts - 1)) * 60_000;

@Injectable()
export class DispatchNotificationUseCase {
  private readonly logger = new Logger(DispatchNotificationUseCase.name);
  private readonly registry: NotificationProviderRegistry;

  constructor(
    private readonly router: NotificationRouter,
    private readonly templateRenderer: TemplateRenderer,
    @Inject(NOTIFICATION_PROVIDERS)
    providers: NotificationProviderRegistry | INotificationProvider,
    @Inject(NOTIFICATION_RECORD_REPOSITORY)
    private readonly recordRepository: INotificationRecordRepository,
    private readonly recipientResolver?: RecipientResolver,
  ) {
    this.registry =
      providers instanceof Map
        ? providers
        : new Map(
            Object.values(NotificationChannel).map((c) => [
              c,
              providers as INotificationProvider,
            ]),
          );
  }

  async run(
    command: DispatchNotificationCommand,
    options?: DispatchNotificationOptions,
  ): Promise<void> {
    void options;
    const channels = this.router.resolve(command.event);
    if (!channels.length) return;

    let destinations: { channel: NotificationChannel; to: string }[] = [];
    if (command.recipientUserId && this.recipientResolver) {
      destinations = await this.recipientResolver.resolve(
        command.recipientUserId,
        command.event,
        channels,
      );
      // Registra SKIPPED para canal sem destino (ex.: sem Telegram vinculado)
      for (const channel of channels) {
        if (!destinations.some((d) => d.channel === channel)) {
          await this.safeCreate({
            event: command.event,
            channel,
            to: '-',
            status: NotificationRecordStatus.SKIPPED,
            errorMessage: 'NO_DESTINATION_OR_OPTED_OUT',
            payload: command.payload,
            userId: command.recipientUserId,
            tenantId: command.tenantId ?? null,
          });
        }
      }
    } else if (command.to) {
      destinations = channels.map((channel) => ({
        channel,
        to: command.to as string,
      }));
    } else {
      this.logger.warn(
        `Notification ${command.event} sem destinatário (to/recipientUserId)`,
      );
      return;
    }

    for (const dest of destinations) {
      let idempotencyKey: string | null = null;
      if (command.idempotencyKey) {
        const suffix = createHash('sha256')
          .update(`${dest.channel}:${dest.to}`)
          .digest('hex')
          .slice(0, 16);
        idempotencyKey = `${command.idempotencyKey}:${suffix}`.slice(0, 256);
        if (
          this.recordRepository.findByIdempotencyKey &&
          (await this.recordRepository.findByIdempotencyKey(idempotencyKey))
        ) {
          continue; // dedupe
        }
      }

      const record = await this.safeCreate({
        event: command.event,
        channel: dest.channel,
        to: dest.to.slice(0, 320),
        status: NotificationRecordStatus.PENDING,
        payload: command.payload,
        userId: command.recipientUserId ?? null,
        tenantId: command.tenantId ?? null,
        idempotencyKey,
        attempts: 0,
      });
      if (record) await this.processRecord(record);
    }
  }

  /** Uma tentativa de entrega. Nunca lança: falha vira FAILED + nextRetryAt. */
  async processRecord(record: NotificationRecordEntity): Promise<void> {
    const provider = this.registry.get(record.channel);
    const attempts = (record.attempts ?? 0) + 1;
    if (!provider) {
      await this.safeUpdate(record.id, {
        status: NotificationRecordStatus.FAILED,
        attempts,
        errorMessage: `No provider for channel ${record.channel}`,
        nextRetryAt: null,
      });
      return;
    }
    try {
      const template = this.templateRenderer.render({
        event: record.event,
        channel: record.channel,
        payload: record.payload ?? {},
      });
      const prepared: PreparedNotification = {
        event: record.event,
        channel: record.channel,
        to: record.to,
        template,
        payload: record.payload ?? {},
      };
      const result = await provider.dispatch(prepared);
      await this.safeUpdate(record.id, {
        status: NotificationRecordStatus.SENT,
        attempts,
        sentAt: new Date(),
        nextRetryAt: null,
        errorMessage: null,
        providerMessageId:
          result && typeof result === 'object'
            ? (result.providerMessageId ?? null)
            : null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown notification error';
      const code = error instanceof PushDeliveryError ? error.code : undefined;
      if (
        record.channel === NotificationChannel.PUSH &&
        code &&
        INVALID_FCM_TOKEN_CODES.has(code)
      ) {
        await this.recipientResolver?.deactivatePushToken(record.to);
      }
      const exhausted = attempts >= MAX_ATTEMPTS;
      await this.safeUpdate(record.id, {
        status: NotificationRecordStatus.FAILED,
        attempts,
        errorMessage: message,
        nextRetryAt: exhausted
          ? null
          : new Date(Date.now() + backoffMs(attempts)),
      });
      this.logger.warn(
        `Notification ${record.event}/${record.channel} failed (attempt ${attempts}): ${message}`,
      );
    }
  }

  private async safeCreate(
    data: Parameters<INotificationRecordRepository['create']>[0],
  ): Promise<NotificationRecordEntity | null> {
    try {
      return await this.recordRepository.create(data);
    } catch (e) {
      this.logger.error('Failed to persist notification record', e as Error);
      return null;
    }
  }

  private async safeUpdate(
    id: string,
    data: Parameters<INotificationRecordRepository['update']>[1],
  ): Promise<void> {
    if (typeof this.recordRepository.update !== 'function') return;
    await this.recordRepository.update(id, data).catch((e) => {
      this.logger.error('Failed to update notification record', e as Error);
    });
  }
}
