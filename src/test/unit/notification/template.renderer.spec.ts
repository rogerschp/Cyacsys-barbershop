import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { TemplateRenderer } from 'src/modules/notification/templates/template.renderer';

describe('TemplateRenderer', () => {
  const renderer = new TemplateRenderer();

  it('renderiza team invitation', () => {
    const out = renderer.render({
      event: NotificationEvent.TEAM_INVITATION,
      channel: NotificationChannel.EMAIL,
      payload: {
        tenantName: 'Barbearia Viking',
        role: 'BARBER',
        token: 'abc',
        expiresAt: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(out.subject).toContain('Barbearia Viking');
    expect(out.body).toContain('BARBER');
    expect(out.body).toContain('abc');
  });
});
