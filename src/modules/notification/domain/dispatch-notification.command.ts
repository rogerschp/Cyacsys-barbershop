import { NotificationEvent } from './notification-event.enum';

export interface DispatchNotificationCommand {
  event: NotificationEvent;
  /** Legado: destino único (ex.: e-mail de convite sem usuário cadastrado). */
  to?: string;
  /** Preferencial: resolve e-mail/telefone/Telegram/push a partir do usuário. */
  recipientUserId?: string;
  tenantId?: string;
  payload: Record<string, unknown>;
  /** Dedupe: mesma key nunca gera dois envios (ex.: booking:123:CONFIRMED). */
  idempotencyKey?: string;
}

export interface DispatchNotificationOptions {
  retries?: number;
}
