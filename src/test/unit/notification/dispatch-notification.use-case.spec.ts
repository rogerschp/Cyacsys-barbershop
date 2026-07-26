import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationRecordStatus } from 'src/modules/notification/domain/notification-record-status.enum';
import { DispatchNotificationUseCase } from 'src/modules/notification/use-cases/dispatch-notification.use-case';
import { NotificationRouter } from 'src/modules/notification/routing/notification.router';
import { TemplateRenderer } from 'src/modules/notification/templates/template.renderer';

describe('DispatchNotificationUseCase', () => {
  it('orquestra router → renderer → provider → record SENT', async () => {
    const provider = { dispatch: jest.fn().mockResolvedValue(undefined) };
    const recordRepository = { create: jest.fn().mockResolvedValue({}) };
    const useCase = new DispatchNotificationUseCase(
      new NotificationRouter(),
      new TemplateRenderer(),
      provider as never,
      recordRepository as never,
    );

    await useCase.run({
      event: NotificationEvent.TEAM_INVITATION,
      to: 'a@b.com',
      payload: {
        tenantName: 'Shop',
        role: 'BARBER',
        token: 't',
        expiresAt: 'x',
      },
    });

    expect(provider.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NotificationEvent.TEAM_INVITATION,
        channel: NotificationChannel.EMAIL,
        to: 'a@b.com',
      }),
      undefined,
    );
    expect(recordRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationRecordStatus.SENT,
        channel: NotificationChannel.EMAIL,
      }),
    );
  });

  it('grava FAILED e relança quando provider falha', async () => {
    const provider = {
      dispatch: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const recordRepository = { create: jest.fn().mockResolvedValue({}) };
    const useCase = new DispatchNotificationUseCase(
      new NotificationRouter(),
      new TemplateRenderer(),
      provider as never,
      recordRepository as never,
    );

    await expect(
      useCase.run({
        event: NotificationEvent.TEAM_INVITATION,
        to: 'a@b.com',
        payload: { tenantName: 'Shop', role: 'BARBER', token: 't' },
      }),
    ).rejects.toThrow('boom');

    expect(recordRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationRecordStatus.FAILED,
        errorMessage: 'boom',
      }),
    );
  });
});
