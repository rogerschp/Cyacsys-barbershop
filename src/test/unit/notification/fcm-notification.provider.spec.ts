import * as admin from 'firebase-admin';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { FcmNotificationProvider } from 'src/modules/notification/providers/fcm-notification.provider';

jest.mock('firebase-admin', () => ({
  apps: [{}],
  messaging: jest.fn(),
}));

describe('FcmNotificationProvider', () => {
  it('envia notification + data via FCM e retorna messageId', async () => {
    const send = jest.fn().mockResolvedValue('msg-1');
    (admin.messaging as jest.Mock).mockReturnValue({ send });
    const provider = new FcmNotificationProvider();
    const result = await provider.dispatch({
      event: NotificationEvent.BOOKING_CONFIRMED,
      channel: NotificationChannel.PUSH,
      to: 'fcm-token',
      template: { subject: 'Confirmado', body: 'Te vejo lá' },
      payload: { bookingId: 'b1' },
    });
    expect(send).toHaveBeenCalledWith({
      token: 'fcm-token',
      notification: { title: 'Confirmado', body: 'Te vejo lá' },
      data: { bookingId: 'b1', event: 'BOOKING_CONFIRMED' },
    });
    expect(result).toEqual({ providerMessageId: 'msg-1' });
  });

  it('propaga code do FCM para desativação de token inválido', async () => {
    const send = jest.fn().mockRejectedValue(
      Object.assign(new Error('gone'), { code: 'messaging/registration-token-not-registered' }),
    );
    (admin.messaging as jest.Mock).mockReturnValue({ send });
    const provider = new FcmNotificationProvider();
    await expect(
      provider.dispatch({
        event: NotificationEvent.BOOKING_CONFIRMED,
        channel: NotificationChannel.PUSH,
        to: 'bad-token',
        template: { subject: 'a', body: 'b' },
        payload: {},
      }),
    ).rejects.toMatchObject({ code: 'messaging/registration-token-not-registered' });
  });
});
