import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DispatchNotificationOptions } from '../domain/dispatch-notification.command';
import { NotificationChannel } from '../domain/notification-channel.enum';
import {
  INotificationProvider,
  PreparedNotification,
} from '../interfaces/notification-provider.interface';

/**
 * WhatsApp via Meta Cloud API — já implementado, desligado por padrão.
 *
 * Para ligar no futuro, SEM mudar código:
 *  1. Preencher WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN
 *  2. Adicionar WHATSAPP na variável do evento, ex.:
 *     NOTIFICATION_CHANNELS_BOOKING_CONFIRMED=PUSH,TELEGRAM,WHATSAPP
 *
 * Modos:
 *  - Template (fora da janela de 24h, exigido pela Meta): definir
 *    WHATSAPP_TEMPLATE_<EVENTO>=nome_do_template_aprovado (ex.:
 *    WHATSAPP_TEMPLATE_BOOKING_CONFIRMED=booking_confirmed).
 *    Parâmetros enviados na ordem: tenantName, serviceName, startsAt.
 *  - Texto livre (só dentro da janela de 24h): sem template configurado,
 *    envia subject+body como mensagem de texto.
 */
@Injectable()
export class WhatsappNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(WhatsappNotificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async dispatch(
    prepared: PreparedNotification,
    _options?: DispatchNotificationOptions,
  ): Promise<{ providerMessageId?: string }> {
    void _options;
    if (prepared.channel !== NotificationChannel.WHATSAPP) {
      throw new Error(`WhatsApp provider cannot handle ${prepared.channel}`);
    }
    const phoneNumberId = this.config
      .get<string>('WHATSAPP_PHONE_NUMBER_ID')
      ?.trim();
    const token = this.config.get<string>('WHATSAPP_ACCESS_TOKEN')?.trim();
    if (!phoneNumberId || !token) {
      throw new Error(
        'WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not configured',
      );
    }
    const version =
      this.config.get<string>('WHATSAPP_API_VERSION')?.trim() || 'v21.0';
    const to = prepared.to.replace(/\D/g, '');

    const templateName =
      prepared.providerTemplate?.id ??
      this.config.get<string>(`WHATSAPP_TEMPLATE_${prepared.event}`)?.trim();
    const body = templateName
      ? {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code:
                this.config.get<string>('WHATSAPP_TEMPLATE_LANG')?.trim() ||
                'pt_BR',
            },
            ...(this.templateParams(prepared).length
              ? {
                  components: [
                    {
                      type: 'body',
                      parameters: this.templateParams(prepared).map((text) => ({
                        type: 'text',
                        text,
                      })),
                    },
                  ],
                }
              : {}),
          },
        }
      : {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: `${prepared.template.subject}\n\n${prepared.template.body}`,
          },
        };

    try {
      const { data } = await axios.post(
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
        body,
        {
          timeout: 10_000,
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const messageId = data?.messages?.[0]?.id;
      return messageId ? { providerMessageId: String(messageId) } : {};
    } catch (error) {
      const desc = axios.isAxiosError(error)
        ? ((error.response?.data as { error?: { message?: string } })?.error
            ?.message ?? error.message)
        : error instanceof Error
          ? error.message
          : 'WhatsApp error';
      this.logger.warn(`WhatsApp send failed: ${desc}`);
      throw new Error(`WhatsApp: ${desc}`);
    }
  }

  private templateParams(prepared: PreparedNotification): string[] {
    if (prepared.providerTemplate?.params?.length)
      return prepared.providerTemplate.params;
    const p = prepared.payload ?? {};
    return ['tenantName', 'serviceName', 'startsAt']
      .map((k) => p[k])
      .filter((v) => v !== undefined && v !== null && String(v) !== '')
      .map(String);
  }
}
