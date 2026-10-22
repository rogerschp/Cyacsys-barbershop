import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';

const EVENT_CHANNELS: Record<NotificationEvent, NotificationChannel[]> = {
  [NotificationEvent.TEAM_INVITATION]: [NotificationChannel.EMAIL],
  [NotificationEvent.BOOKING_CREATED]: [
    NotificationChannel.PUSH,
    NotificationChannel.TELEGRAM,
  ],
  [NotificationEvent.BOOKING_CONFIRMED]: [
    NotificationChannel.PUSH,
    NotificationChannel.TELEGRAM,
  ],
  [NotificationEvent.BOOKING_CANCELLED]: [
    NotificationChannel.PUSH,
    NotificationChannel.TELEGRAM,
  ],
  [NotificationEvent.REVIEW_CREATED]: [
    NotificationChannel.PUSH,
    NotificationChannel.TELEGRAM,
  ],
  [NotificationEvent.PASSWORD_RESET]: [NotificationChannel.EMAIL],
  [NotificationEvent.SUBSCRIPTION_EXPIRED]: [
    NotificationChannel.EMAIL,
    NotificationChannel.PUSH,
    NotificationChannel.TELEGRAM,
  ],
};

/**
 * Canais por evento, sobrescrevíveis por env sem tocar em código:
 *   NOTIFICATION_CHANNELS_BOOKING_CONFIRMED=PUSH,TELEGRAM,WHATSAPP
 * É assim que o WhatsApp (ou qualquer canal) é ligado no futuro:
 * só adicionar o nome do canal na variável do evento desejado.
 */
@Injectable()
export class NotificationRouter {
  constructor(private readonly config?: ConfigService) {}

  resolve(event: NotificationEvent): NotificationChannel[] {
    const override = this.config
      ?.get<string>(`NOTIFICATION_CHANNELS_${event}`)
      ?.split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c): c is NotificationChannel =>
        Object.values(NotificationChannel).includes(c as NotificationChannel),
      );
    if (override?.length) return [...new Set(override)];
    return [...(EVENT_CHANNELS[event] ?? [])];
  }
}
