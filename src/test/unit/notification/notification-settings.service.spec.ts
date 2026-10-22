import { NotFoundException } from '@nestjs/common';
import { DevicePlatform } from 'src/modules/notification/domain/device-platform.enum';
import { NotificationChannel } from 'src/modules/notification/domain/notification-channel.enum';
import { NotificationEvent } from 'src/modules/notification/domain/notification-event.enum';
import { NotificationSettingsService } from 'src/modules/notification/use-cases/notification-settings.service';

function build(opts?: {
  existingToken?: unknown;
  existingPref?: unknown;
  tokens?: unknown[];
  prefs?: unknown[];
  user?: unknown;
  botUsername?: string;
}) {
  const tokenRepo = {
    findOne: jest.fn().mockResolvedValue(opts?.existingToken ?? null),
    find: jest.fn().mockResolvedValue(opts?.tokens ?? []),
    create: jest.fn((x: unknown) => x),
    save: jest.fn().mockImplementation(async (x: unknown) => x),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const prefRepo = {
    findOne: jest.fn().mockResolvedValue(opts?.existingPref ?? null),
    find: jest.fn().mockResolvedValue(opts?.prefs ?? []),
    create: jest.fn((x: unknown) => x),
    save: jest.fn().mockImplementation(async (x: unknown) => x),
  };
  const linkRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((x: unknown) => x),
    save: jest.fn().mockImplementation(async (x: unknown) => x),
  };
  const userRepo = {
    findOne: jest.fn().mockResolvedValue(opts?.user ?? null),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const config = {
    get: jest
      .fn()
      .mockImplementation((k: string) =>
        k === 'TELEGRAM_BOT_USERNAME' ? opts?.botUsername : undefined,
      ),
  };
  const service = new NotificationSettingsService(
    tokenRepo as never,
    prefRepo as never,
    linkRepo as never,
    userRepo as never,
    config as never,
  );
  return { service, tokenRepo, prefRepo, linkRepo, userRepo };
}

describe('NotificationSettingsService', () => {
  it('registerToken cria novo quando não existe', async () => {
    const { service, tokenRepo } = build();
    const out = await service.registerToken('u1', {
      token: 'fcm-1',
      platform: DevicePlatform.WEB,
      deviceId: 'd1',
    });
    expect(tokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        token: 'fcm-1',
        isActive: true,
        deviceId: 'd1',
      }),
    );
    expect(out).toEqual(expect.objectContaining({ token: 'fcm-1' }));
  });

  it('registerToken reativa token existente', async () => {
    const existing = { userId: 'old', deviceId: 'keep', isActive: false };
    const { service } = build({ existingToken: existing });
    const out = await service.registerToken('u2', {
      token: 'fcm-1',
      platform: DevicePlatform.ANDROID,
    });
    expect(out).toEqual(
      expect.objectContaining({
        userId: 'u2',
        isActive: true,
        deviceId: 'keep',
      }),
    );
  });

  it('listTokens e removeToken (achou / não achou)', async () => {
    const { service, tokenRepo } = build({ tokens: [{ id: 't1' }] });
    await expect(service.listTokens('u1')).resolves.toEqual([{ id: 't1' }]);

    const found = build({ existingToken: { id: 't1' } });
    // removeToken usa findOne({id,userId}) — o mock retorna existingToken
    await expect(found.service.removeToken('u1', 't1')).resolves.toEqual({
      deleted: true,
    });
    expect(found.tokenRepo.delete).toHaveBeenCalledWith('t1');
    void tokenRepo;

    const missing = build();
    await expect(missing.service.removeToken('u1', 'xx')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('preferences: lista, cria e atualiza', async () => {
    const { service } = build({ prefs: [] });
    await expect(service.listPreferences('u1')).resolves.toEqual([]);
    await service.upsertPreference('u1', {
      event: NotificationEvent.BOOKING_CONFIRMED,
      channel: NotificationChannel.PUSH,
      enabled: false,
    });

    const existing = { enabled: true };
    const upd = build({ existingPref: existing });
    const out = await upd.service.upsertPreference('u1', {
      event: NotificationEvent.BOOKING_CONFIRMED,
      channel: NotificationChannel.TELEGRAM,
      enabled: false,
    });
    expect(out).toEqual(expect.objectContaining({ enabled: false }));
  });

  it('telegramStatus ligado/desligado/sem usuário', async () => {
    const linkedAt = new Date();
    const { service } = build({
      user: { telegramChatId: '123', telegramLinkedAt: linkedAt },
    });
    await expect(service.telegramStatus('u1')).resolves.toEqual({
      linked: true,
      linkedAt,
    });
    const off = build({
      user: { telegramChatId: null, telegramLinkedAt: null },
    });
    await expect(off.service.telegramStatus('u1')).resolves.toEqual({
      linked: false,
      linkedAt: null,
    });
    const none = build({ user: null });
    await expect(none.service.telegramStatus('u1')).resolves.toEqual({
      linked: false,
      linkedAt: null,
    });
  });

  it('createTelegramLink com e sem username do bot', async () => {
    const withBot = build({ botUsername: '@CiacsysDevBot' });
    const out = await withBot.service.createTelegramLink('u1');
    expect(out.url).toMatch(/^https:\/\/t\.me\/CiacsysDevBot\?start=/);
    expect(out.instructions).toContain('Iniciar');

    const noBot = build();
    const out2 = await noBot.service.createTelegramLink('u1');
    expect(out2.url).toBeNull();
    expect(out2.token).toBeTruthy();
  });

  it('webhook /start válido vincula chat_id', async () => {
    const { service, userRepo, linkRepo } = build();
    const link = {
      userId: 'u9',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    linkRepo.findOne.mockResolvedValue(link);
    await expect(
      service.handleTelegramWebhook({
        message: { chat: { id: 555 }, text: '/start abc123' },
      }),
    ).resolves.toEqual({ ok: true });
    expect(userRepo.update).toHaveBeenCalledWith('u9', {
      telegramChatId: '555',
      telegramLinkedAt: expect.any(Date),
    });
    expect((link as { usedAt: unknown }).usedAt).toBeInstanceOf(Date);
  });

  it('webhook ignora casos inválidos sem tocar no usuário', async () => {
    const { service, userRepo, linkRepo } = build();
    await expect(service.handleTelegramWebhook(null)).resolves.toEqual({
      ok: true,
    });
    await service.handleTelegramWebhook({ message: { text: '/start abc' } }); // sem chat
    await service.handleTelegramWebhook({
      message: { chat: { id: 1 }, text: '/start' },
    }); // sem token
    linkRepo.findOne.mockResolvedValue(null);
    await service.handleTelegramWebhook({
      message: { chat: { id: 1 }, text: '/start abc' },
    });
    linkRepo.findOne.mockResolvedValue({
      userId: 'u1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000),
    });
    await service.handleTelegramWebhook({
      message: { chat: { id: 1 }, text: '/start abc' },
    });
    linkRepo.findOne.mockResolvedValue({
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await service.handleTelegramWebhook({
      message: { chat: { id: 1 }, text: '/start abc' },
    });
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
