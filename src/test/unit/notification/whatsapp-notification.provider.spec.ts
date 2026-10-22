import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { WhatsappNotificationProvider } from 'src/modules/notification/providers/whatsapp-notification.provider';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const cfg = (vars: Record<string, string | undefined>) =>
  ({ get: jest.fn((k: string) => vars[k]) }) as unknown as ConfigService;

const prepared = {
  event: NotificationEvent.BOOKING_CONFIRMED,
  channel: NotificationChannel.WHATSAPP,
  to: '+55 (11) 99999-9999',
  template: { subject: 'Confirmado', body: 'Te vejo lá' },
  payload: { tenantName: 'Viking', startsAt: '2026-01-01 10:00' },
};

describe('WhatsappNotificationProvider (Meta Cloud API)', () => {
  it('sem credenciais: falha clara (canal desligado)', async () => {
    const provider = new WhatsappNotificationProvider(cfg({}));
    await expect(provider.dispatch(prepared)).rejects.toThrow(
      'WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN not configured',
    );
  });

  it('modo texto: POST graph.facebook.com com telefone só dígitos', async () => {
    mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'w1' }] } });
    const provider = new WhatsappNotificationProvider(
      cfg({ WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_ACCESS_TOKEN: 'tok' }),
    );
    const result = await provider.dispatch(prepared);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://graph.facebook.com/v21.0/123/messages',
      expect.objectContaining({ to: '5511999999999', type: 'text' }),
      expect.objectContaining({
        headers: { Authorization: 'Bearer tok' },
      }),
    );
    expect(result).toEqual({ providerMessageId: 'w1' });
  });

  it('modo template: WHATSAPP_TEMPLATE_<EVENTO> vira template aprovado', async () => {
    mockedAxios.post.mockResolvedValue({ data: { messages: [{ id: 'w2' }] } });
    const provider = new WhatsappNotificationProvider(
      cfg({
        WHATSAPP_PHONE_NUMBER_ID: '123',
        WHATSAPP_ACCESS_TOKEN: 'tok',
        WHATSAPP_TEMPLATE_BOOKING_CONFIRMED: 'booking_confirmed',
      }),
    );
    await provider.dispatch(prepared);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        type: 'template',
        template: expect.objectContaining({ name: 'booking_confirmed' }),
      }),
      expect.any(Object),
    );
  });
});
