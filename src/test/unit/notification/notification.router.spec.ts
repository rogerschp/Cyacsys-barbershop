import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationRouter } from 'src/modules/notification/routing/notification.router';

describe('NotificationRouter', () => {
  const router = new NotificationRouter();

  it('mapeia TEAM_INVITATION para EMAIL', () => {
    expect(router.resolve(NotificationEvent.TEAM_INVITATION)).toEqual([
      NotificationChannel.EMAIL,
    ]);
  });

  it('mapeia BOOKING_CONFIRMED para PUSH + TELEGRAM', () => {
    expect(router.resolve(NotificationEvent.BOOKING_CONFIRMED)).toEqual([
      NotificationChannel.PUSH,
      NotificationChannel.TELEGRAM,
    ]);
  });

  it('env NOTIFICATION_CHANNELS_<EVENTO> liga o WhatsApp sem mudar código', () => {
    const withWhats = new NotificationRouter({
      get: jest.fn().mockReturnValue('PUSH,TELEGRAM,WHATSAPP'),
    } as never);
    expect(withWhats.resolve(NotificationEvent.BOOKING_CONFIRMED)).toEqual([
      NotificationChannel.PUSH,
      NotificationChannel.TELEGRAM,
      NotificationChannel.WHATSAPP,
    ]);
  });
});
