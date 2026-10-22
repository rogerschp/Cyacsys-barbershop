import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';
import { UserDeviceTokenEntity } from '../entities/user-device-token.entity';
import { UserNotificationPreferenceEntity } from '../entities/user-notification-preference.entity';

export interface ResolvedDestination {
  channel: NotificationChannel;
  to: string;
}

/** userId -> destinos por canal, respeitando opt-out. Sem destino = canal ignorado. */
@Injectable()
export class RecipientResolver {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserDeviceTokenEntity)
    private readonly tokenRepo: Repository<UserDeviceTokenEntity>,
    @InjectRepository(UserNotificationPreferenceEntity)
    private readonly prefRepo: Repository<UserNotificationPreferenceEntity>,
  ) {}

  async findUser(userId: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async isEnabled(
    userId: string,
    event: NotificationEvent,
    channel: NotificationChannel,
  ): Promise<boolean> {
    const pref = await this.prefRepo.findOne({
      where: { userId, event, channel },
    });
    return pref ? pref.enabled : true; // sem registro = opt-in padrão
  }

  async resolve(
    userId: string,
    event: NotificationEvent,
    channels: NotificationChannel[],
  ): Promise<ResolvedDestination[]> {
    const user = await this.findUser(userId);
    if (!user) return [];
    const out: ResolvedDestination[] = [];
    for (const channel of channels) {
      if (!(await this.isEnabled(userId, event, channel))) continue;
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (user.email) out.push({ channel, to: user.email });
          break;
        case NotificationChannel.WHATSAPP:
          if (user.telephone) out.push({ channel, to: user.telephone });
          break;
        case NotificationChannel.TELEGRAM:
          if (user.telegramChatId)
            out.push({ channel, to: user.telegramChatId });
          break;
        case NotificationChannel.PUSH: {
          const tokens = await this.tokenRepo.find({
            where: { userId, isActive: true },
          });
          for (const t of tokens) out.push({ channel, to: t.token });
          break;
        }
      }
    }
    return out;
  }

  async deactivatePushToken(token: string): Promise<void> {
    await this.tokenRepo.update({ token }, { isActive: false });
  }
}
