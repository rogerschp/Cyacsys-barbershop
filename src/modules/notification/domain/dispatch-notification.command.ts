import { NotificationEvent } from './notification-event.enum';

export interface DispatchNotificationCommand {
  event: NotificationEvent;
  to: string;
  payload: Record<string, unknown>;
}

export interface DispatchNotificationOptions {
  retries?: number;
}
