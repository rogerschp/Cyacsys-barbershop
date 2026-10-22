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
  /** Futuro WhatsApp (Meta): template aprovado + parâmetros ordenados. */
  providerTemplate?: { id: string; params: string[] };
}

export interface INotificationProvider {
  dispatch(
    prepared: PreparedNotification,
    options?: DispatchNotificationOptions,
  ): Promise<{ providerMessageId?: string } | void>;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
/** Registry multi-canal: Map<NotificationChannel, INotificationProvider> */
export const NOTIFICATION_PROVIDERS = Symbol('NOTIFICATION_PROVIDERS');
export type NotificationProviderRegistry = Map<
  NotificationChannel,
  INotificationProvider
>;
