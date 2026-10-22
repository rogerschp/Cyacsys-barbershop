import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DispatchNotificationOptions } from '../domain/dispatch-notification.command';
import { NotificationChannel } from '../domain/notification-channel.enum';
import {
  INotificationProvider,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';

/** Telegram Bot API — requer usuário vinculado (telegram_chat_id via /start). */
@Injectable()
export class TelegramNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(TelegramNotificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async dispatch(
    prepared: PreparedNotification,
    _options?: DispatchNotificationOptions,
  ): Promise<{ providerMessageId?: string }> {
    void _options;
    if (prepared.channel !== NotificationChannel.TELEGRAM) {
      throw new Error(`Telegram provider cannot handle ${prepared.channel}`);
    }
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim();
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

    const text = `${prepared.template.subject}\n\n${prepared.template.body}`;
    try {
      const { data } = await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        { chat_id: prepared.to, text },
        { timeout: 10_000 },
      );
      const messageId = data?.result?.message_id;
      return messageId ? { providerMessageId: String(messageId) } : {};
    } catch (error) {
      const desc =
        axios.isAxiosError(error)
          ? (error.response?.data as { description?: string })?.description ??
            error.message
          : error instanceof Error
            ? error.message
            : 'Telegram error';
      this.logger.warn(`Telegram send failed: ${desc}`);
      throw new Error(`Telegram: ${desc}`);
    }
  }
}
