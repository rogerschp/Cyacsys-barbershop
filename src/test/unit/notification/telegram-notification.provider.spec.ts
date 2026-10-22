import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { TelegramNotificationProvider } from 'src/modules/notification/providers/telegram-notification.provider';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramNotificationProvider', () => {
  const config = (token?: string) =>
    ({ get: jest.fn().mockReturnValue(token) }) as unknown as ConfigService;

  it('envia sendMessage com chat_id e texto do template', async () => {
    mockedAxios.post.mockResolvedValue({ data: { result: { message_id: 42 } } });
    const provider = new TelegramNotificationProvider(config('bot-token'));
    const result = await provider.dispatch({
      event: NotificationEvent.BOOKING_CONFIRMED,
      channel: NotificationChannel.TELEGRAM,
      to: '999',
      template: { subject: 'Confirmado', body: 'Te vejo lá' },
      payload: {},
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      { chat_id: '999', text: 'Confirmado\n\nTe vejo lá' },
      { timeout: 10_000 },
    );
    expect(result).toEqual({ providerMessageId: '42' });
  });

  it('falha sem TELEGRAM_BOT_TOKEN', async () => {
    const provider = new TelegramNotificationProvider(config(undefined));
    await expect(
      provider.dispatch({
        event: NotificationEvent.BOOKING_CONFIRMED,
        channel: NotificationChannel.TELEGRAM,
        to: '999',
        template: { subject: 'a', body: 'b' },
        payload: {},
      }),
    ).rejects.toThrow('TELEGRAM_BOT_TOKEN not configured');
  });
});
