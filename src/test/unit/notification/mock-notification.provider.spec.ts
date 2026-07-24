import { Logger } from '@nestjs/common';
import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { MockNotificationProvider } from 'src/modules/notification/providers/mock-notification.provider';

describe('MockNotificationProvider', () => {
  it('loga via Nest Logger', async () => {
    const provider = new MockNotificationProvider();
    const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    await provider.dispatch({
      event: NotificationEvent.TEAM_INVITATION,
      channel: NotificationChannel.EMAIL,
      to: 'barber@email.com',
      template: { subject: 'Convite', body: 'Corpo' },
      payload: { tenantName: 'Viking', role: 'BARBER', token: 'tok' },
    });

    expect(spy).toHaveBeenCalled();
    const message = String(spy.mock.calls[0][0]);
    expect(message).toContain('TEAM_INVITATION');
    expect(message).toContain('barber@email.com');
    spy.mockRestore();
  });
});
