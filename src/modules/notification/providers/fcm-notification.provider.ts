import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { DispatchNotificationOptions } from '../domain/dispatch-notification.command';
import { NotificationChannel } from '../domain/notification-channel.enum';
import {
  INotificationProvider,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';

export class PushDeliveryError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Push via Firebase Cloud Messaging (Firebase Admin já inicializado no app). */
@Injectable()
export class FcmNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(FcmNotificationProvider.name);

  async dispatch(
    prepared: PreparedNotification,
    _options?: DispatchNotificationOptions,
  ): Promise<{ providerMessageId?: string }> {
    void _options;
    if (prepared.channel !== NotificationChannel.PUSH) {
      throw new Error(`FCM provider cannot handle ${prepared.channel}`);
    }
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');

    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(prepared.payload ?? {})) {
      data[k] = typeof v === 'string' ? v : JSON.stringify(v ?? '');
    }
    data.event = prepared.event;

    try {
      const messageId = await admin.messaging().send({
        token: prepared.to,
        notification: {
          title: prepared.template.subject,
          body: prepared.template.body,
        },
        data,
      });
      return { providerMessageId: messageId };
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const message = error instanceof Error ? error.message : 'FCM error';
      this.logger.warn(`FCM send failed (${code ?? 'no-code'}): ${message}`);
      throw new PushDeliveryError(message, code);
    }
  }
}

export const INVALID_FCM_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);
