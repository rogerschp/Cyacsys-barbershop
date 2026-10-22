import { ForbiddenException } from '@nestjs/common';
import { NotificationController } from 'src/modules/notification/notification.controller';

describe('NotificationController', () => {
  const settings = {
    registerToken: jest.fn().mockResolvedValue({ id: 't1' }),
    listTokens: jest.fn().mockResolvedValue([]),
    removeToken: jest.fn().mockResolvedValue({ deleted: true }),
    listPreferences: jest.fn().mockResolvedValue([]),
    upsertPreference: jest.fn().mockResolvedValue({ id: 'p1' }),
    telegramStatus: jest.fn().mockResolvedValue({ linked: true }),
    createTelegramLink: jest.fn().mockResolvedValue({ url: 'https://t.me/x' }),
    handleTelegramWebhook: jest.fn().mockResolvedValue({ ok: true }),
  };
  const config = { get: jest.fn().mockReturnValue('segredo') };
  const controller = new NotificationController(
    settings as never,
    config as never,
  );
  const req = { user: { dbUser: { id: 'user-1' } } } as never;

  beforeEach(() => jest.clearAllMocks());

  it('delega device-tokens com o userId do JWT', async () => {
    const dto = { token: 'tok', platform: 'WEB' } as never;
    await controller.registerToken(req, dto);
    expect(settings.registerToken).toHaveBeenCalledWith('user-1', dto);
    await controller.listTokens(req);
    expect(settings.listTokens).toHaveBeenCalledWith('user-1');
    await controller.removeToken(req, 't1');
    expect(settings.removeToken).toHaveBeenCalledWith('user-1', 't1');
  });

  it('delega preferences', async () => {
    await controller.listPreferences(req);
    expect(settings.listPreferences).toHaveBeenCalledWith('user-1');
    const dto = {
      event: 'BOOKING_CONFIRMED',
      channel: 'PUSH',
      enabled: false,
    } as never;
    await controller.upsertPreference(req, dto);
    expect(settings.upsertPreference).toHaveBeenCalledWith('user-1', dto);
  });

  it('delega telegram status/link', async () => {
    await controller.telegramStatus(req);
    expect(settings.telegramStatus).toHaveBeenCalledWith('user-1');
    await controller.telegramLink(req);
    expect(settings.createTelegramLink).toHaveBeenCalledWith('user-1');
  });

  it('sem usuário autenticado lança Forbidden', () => {
    expect(() => controller.listTokens({} as never)).toThrow(
      ForbiddenException,
    );
    expect(() => controller.listTokens({ user: {} } as never)).toThrow(
      ForbiddenException,
    );
  });

  it('webhook com secret correto delega; errado lança Forbidden', async () => {
    await controller.telegramWebhook('segredo', { message: {} });
    expect(settings.handleTelegramWebhook).toHaveBeenCalled();
    await expect(controller.telegramWebhook('errado', {})).rejects.toThrow(
      ForbiddenException,
    );
    await expect(controller.telegramWebhook(undefined, {})).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('webhook sem secret configurado aceita qualquer chamada', async () => {
    const open = new NotificationController(
      settings as never,
      { get: jest.fn().mockReturnValue(undefined) } as never,
    );
    await open.telegramWebhook(undefined, {});
    expect(settings.handleTelegramWebhook).toHaveBeenCalled();
  });
});
