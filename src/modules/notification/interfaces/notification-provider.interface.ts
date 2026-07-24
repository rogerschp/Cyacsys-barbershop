import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';
import { DispatchNotificationOptions } from '../domain/dispatch-notification.command';

export interface RenderedNotificationTemplate {
  subject: string;
  body: string;
}

export interface PreparedNotification {
  event: NotificationEvent;
  channel: NotificationChannel;
  to: string;
  template: RenderedNotificationTemplate;
  payload: Record<string, unknown>;
}

export interface INotificationProvider {
  dispatch(
    prepared: PreparedNotification,
    options?: DispatchNotificationOptions,
  ): Promise<void>;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
