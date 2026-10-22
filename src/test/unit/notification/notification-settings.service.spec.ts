import { NotificationSettingsService } from 'src/modules/notification/use-cases/notification-settings.service';

describe('NotificationSettingsService (telegram webhook)', () => {
  function make(link: unknown) {
    const linkRepo = {
      findOne: jest.fn().mockResolvedValue(link),
      save: jest.fn().mockImplementation(async (x: unknown) => x),
      create: jest.fn((x: unknown) => x),
    };
    const userRepo = {
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
    };
    const service = new NotificationSettingsService(
      {} as never,
      {} as never,
      linkRepo as never,
      userRepo as never,
      { get: jest.fn() } as never,
    );
    return { service, linkRepo, userRepo };
  }

  it('/start com token válido vincula chat_id', async () => {
    const link = {
      userId: 'u1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const { service, userRepo } = make(link);
    // token raw precisa hashear igual ao gravado: usamos o service para gerar hash indiretamente
    // aqui simulamos findOne já resolvido independente do hash
    const res = await service.handleTelegramWebhook({
      message: { chat: { id: 555 }, text: '/start abc123' },
    });
    expect(res).toEqual({ ok: true });
    expect(userRepo.update).toHaveBeenCalledWith('u1', {
      telegramChatId: '555',
      telegramLinkedAt: expect.any(Date),
    });
    expect(link.usedAt).toBeInstanceOf(Date);
  });

  it('mensagem sem /start é ignorada', async () => {
    const { service, userRepo } = make(null);
    await service.handleTelegramWebhook({
      message: { chat: { id: 1 }, text: 'oi' },
    });
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
