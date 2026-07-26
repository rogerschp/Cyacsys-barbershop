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
});
