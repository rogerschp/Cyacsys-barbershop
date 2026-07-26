import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';

const EVENT_CHANNELS: Record<NotificationEvent, NotificationChannel[]> = {
  [NotificationEvent.TEAM_INVITATION]: [NotificationChannel.EMAIL],
  [NotificationEvent.BOOKING_CREATED]: [NotificationChannel.EMAIL],
  [NotificationEvent.BOOKING_CONFIRMED]: [NotificationChannel.EMAIL],
  [NotificationEvent.BOOKING_CANCELLED]: [NotificationChannel.EMAIL],
  [NotificationEvent.REVIEW_CREATED]: [NotificationChannel.EMAIL],
  [NotificationEvent.PASSWORD_RESET]: [NotificationChannel.EMAIL],
  [NotificationEvent.SUBSCRIPTION_EXPIRED]: [NotificationChannel.EMAIL],
};

@Injectable()
export class NotificationRouter {
  resolve(event: NotificationEvent): NotificationChannel[] {
    return [...(EVENT_CHANNELS[event] ?? [])];
  }
}
