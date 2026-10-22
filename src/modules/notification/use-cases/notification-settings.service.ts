import { createHash, randomBytes } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { RegisterDeviceTokenDto, UpdateNotificationPreferenceDto } from '../dto/notification.dto';
import { NotificationLinkTokenEntity } from '../entities/notification-link-token.entity';
import { UserDeviceTokenEntity } from '../entities/user-device-token.entity';
import { UserNotificationPreferenceEntity } from '../entities/user-notification-preference.entity';

const hash = (raw: string) => createHash('sha256').update(raw).digest('hex');

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectRepository(UserDeviceTokenEntity)
    private readonly tokenRepo: Repository<UserDeviceTokenEntity>,
    @InjectRepository(UserNotificationPreferenceEntity)
    private readonly prefRepo: Repository<UserNotificationPreferenceEntity>,
    @InjectRepository(NotificationLinkTokenEntity)
    private readonly linkRepo: Repository<NotificationLinkTokenEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {}

  async registerToken(userId: string, dto: RegisterDeviceTokenDto) {
    const existing = await this.tokenRepo.findOne({
      where: { token: dto.token },
    });
    if (existing) {
      existing.userId = userId;
      existing.platform = dto.platform;
      existing.deviceId = dto.deviceId ?? existing.deviceId;
      existing.isActive = true;
      existing.lastSeenAt = new Date();
      return this.tokenRepo.save(existing);
    }
    return this.tokenRepo.save(
      this.tokenRepo.create({
        userId,
        token: dto.token,
        platform: dto.platform,
        deviceId: dto.deviceId ?? null,
        isActive: true,
        lastSeenAt: new Date(),
      }),
    );
  }

  listTokens(userId: string) {
    return this.tokenRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeToken(userId: string, id: string) {
    const token = await this.tokenRepo.findOne({ where: { id, userId } });
    if (!token) throw new NotFoundException('Device token not found');
    await this.tokenRepo.delete(id);
    return { deleted: true };
  }

  listPreferences(userId: string) {
    return this.prefRepo.find({ where: { userId } });
  }

  async upsertPreference(userId: string, dto: UpdateNotificationPreferenceDto) {
    const existing = await this.prefRepo.findOne({
      where: { userId, event: dto.event, channel: dto.channel },
    });
    if (existing) {
      existing.enabled = dto.enabled;
      return this.prefRepo.save(existing);
    }
    return this.prefRepo.save(this.prefRepo.create({ userId, ...dto }));
  }

  async telegramStatus(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return {
      linked: !!user?.telegramChatId,
      linkedAt: user?.telegramLinkedAt ?? null,
    };
  }

  async createTelegramLink(userId: string) {
    const raw = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60_000);
    await this.linkRepo.save(
      this.linkRepo.create({
        userId,
        channel: NotificationChannel.TELEGRAM,
        tokenHash: hash(raw),
        expiresAt,
        usedAt: null,
      }),
    );
    const username = this.config.get<string>('TELEGRAM_BOT_USERNAME')?.replace(/^@/, '');
    return {
      url: username ? `https://t.me/${username}?start=${raw}` : null,
      token: raw,
      expiresAt,
      instructions: username
        ? 'Abra o link e toque em Iniciar (/start) no bot.'
        : 'TELEGRAM_BOT_USERNAME não configurado; envie /start <token> ao bot.',
    };
  }

  /** Webhook do Telegram: captura /start <token> e vincula chat_id. Sempre retorna ok. */
  async handleTelegramWebhook(update: unknown): Promise<{ ok: true }> {
    const msg = (update as { message?: { chat?: { id?: number | string }; text?: string } })?.message;
    const text = msg?.text?.trim() ?? '';
    const chatId = msg?.chat?.id;
    if (!chatId || !text.startsWith('/start')) return { ok: true };
    const raw = text.replace('/start', '').trim();
    if (!raw) return { ok: true };
    const link = await this.linkRepo.findOne({
      where: { tokenHash: hash(raw), channel: NotificationChannel.TELEGRAM },
    });
    if (!link || link.usedAt || link.expiresAt < new Date()) return { ok: true };
    await this.userRepo.update(link.userId, {
      telegramChatId: String(chatId),
      telegramLinkedAt: new Date(),
    });
    link.usedAt = new Date();
    await this.linkRepo.save(link);
    return { ok: true };
  }
}
