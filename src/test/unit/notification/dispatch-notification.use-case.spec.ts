import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationRecordStatus } from 'src/modules/notification/domain/notification-record-status.enum';
import { DispatchNotificationUseCase } from 'src/modules/notification/use-cases/dispatch-notification.use-case';
import { NotificationRouter } from 'src/modules/notification/routing/notification.router';
import { TemplateRenderer } from 'src/modules/notification/templates/template.renderer';

function makeRepo() {
  return {
    create: jest.fn().mockImplementation(async (data: unknown) => ({
      id: 'rec-1',
      attempts: 0,
      ...(data as object),
    })),
    update: jest.fn().mockResolvedValue(undefined),
    findByIdempotencyKey: jest.fn().mockResolvedValue(null),
    findDueForRetry: jest.fn().mockResolvedValue([]),
  };
}

describe('DispatchNotificationUseCase', () => {
  it('orquestra router → renderer → provider do canal → record SENT', async () => {
    const provider = { dispatch: jest.fn().mockResolvedValue(undefined) };
    const recordRepository = makeRepo();
    const useCase = new DispatchNotificationUseCase(
      new NotificationRouter(),
      new TemplateRenderer(),
      new Map([[NotificationChannel.EMAIL, provider]]) as never,
      recordRepository as never,
    );

    await useCase.run({
      event: NotificationEvent.TEAM_INVITATION,
      to: 'a@b.com',
      payload: { tenantName: 'Shop', role: 'BARBER', token: 't', expiresAt: 'x' },
    });

    expect(provider.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        event: NotificationEvent.TEAM_INVITATION,
        channel: NotificationChannel.EMAIL,
        to: 'a@b.com',
      }),
    );
    expect(recordRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: NotificationRecordStatus.PENDING }),
    );
    expect(recordRepository.update).toHaveBeenCalledWith(
      'rec-1',
      expect.objectContaining({ status: NotificationRecordStatus.SENT }),
    );
  });

  it('grava FAILED e NÃO relança quando provider falha (canal isolado)', async () => {
    const provider = { dispatch: jest.fn().mockRejectedValue(new Error('boom')) };
    const recordRepository = makeRepo();
    const useCase = new DispatchNotificationUseCase(
      new NotificationRouter(),
      new TemplateRenderer(),
      new Map([[NotificationChannel.EMAIL, provider]]) as never,
      recordRepository as never,
    );

    await expect(
      useCase.run({
        event: NotificationEvent.TEAM_INVITATION,
        to: 'a@b.com',
        payload: { tenantName: 'Shop', role: 'BARBER', token: 't' },
      }),
    ).resolves.toBeUndefined();

    expect(recordRepository.update).toHaveBeenCalledWith(
      'rec-1',
      expect.objectContaining({
        status: NotificationRecordStatus.FAILED,
        errorMessage: 'boom',
        nextRetryAt: expect.any(Date),
      }),
    );
  });

  it('multi-canal: PUSH e TELEGRAM usam providers diferentes', async () => {
    const push = { dispatch: jest.fn().mockResolvedValue({ providerMessageId: 'm1' }) };
    const telegram = { dispatch: jest.fn().mockResolvedValue(undefined) };
    const recordRepository = makeRepo();
    const resolver = {
      resolve: jest.fn().mockResolvedValue([
        { channel: NotificationChannel.PUSH, to: 'fcm-token' },
        { channel: NotificationChannel.TELEGRAM, to: '12345' },
      ]),
      deactivatePushToken: jest.fn(),
    };
    const useCase = new DispatchNotificationUseCase(
      new NotificationRouter(),
      new TemplateRenderer(),
      new Map([
        [NotificationChannel.PUSH, push],
        [NotificationChannel.TELEGRAM, telegram],
      ]) as never,
      recordRepository as never,
      resolver as never,
    );

    await useCase.run({
      event: NotificationEvent.BOOKING_CONFIRMED,
      recipientUserId: 'user-1',
      tenantId: 'tenant-1',
      idempotencyKey: 'booking:b1:BOOKING_CONFIRMED',
      payload: { bookingId: 'b1', tenantName: 'Viking', startsAt: '2026-01-01' },
    });

    expect(push.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ channel: NotificationChannel.PUSH, to: 'fcm-token' }),
    );
    expect(telegram.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ channel: NotificationChannel.TELEGRAM, to: '12345' }),
    );
  });

  it('dedupe: idempotencyKey já existente não envia de novo', async () => {
    const provider = { dispatch: jest.fn() };
    const recordRepository = makeRepo();
    recordRepository.findByIdempotencyKey.mockResolvedValue({ id: 'old' });
    const useCase = new DispatchNotificationUseCase(
      new NotificationRouter(),
      new TemplateRenderer(),
      new Map([[NotificationChannel.EMAIL, provider]]) as never,
      recordRepository as never,
    );
    await useCase.run({
      event: NotificationEvent.TEAM_INVITATION,
      to: 'a@b.com',
      idempotencyKey: 'invite:1',
      payload: { tenantName: 'Shop', role: 'BARBER', token: 't' },
    });
    expect(provider.dispatch).not.toHaveBeenCalled();
  });
});
