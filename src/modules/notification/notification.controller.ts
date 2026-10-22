import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { RequestUser } from '../auth/strategies/bearer-token.strategy';
import {
  RegisterDeviceTokenDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification.dto';
import { NotificationSettingsService } from './use-cases/notification-settings.service';

type ReqWithUser = { user?: RequestUser };

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly settings: NotificationSettingsService,
    private readonly config: ConfigService,
  ) {}

  private userId(req: ReqWithUser): string {
    const id = req.user?.dbUser?.id;
    if (!id) throw new ForbiddenException('User not found');
    return id;
  }

  @Post('device-tokens')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Registra token FCM do aparelho (push)' })
  registerToken(@Req() req: ReqWithUser, @Body() dto: RegisterDeviceTokenDto) {
    return this.settings.registerToken(this.userId(req), dto);
  }

  @Get('device-tokens')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Lista meus tokens de push' })
  listTokens(@Req() req: ReqWithUser) {
    return this.settings.listTokens(this.userId(req));
  }

  @Delete('device-tokens/:id')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Remove meu token de push' })
  removeToken(@Req() req: ReqWithUser, @Param('id') id: string) {
    return this.settings.removeToken(this.userId(req), id);
  }

  @Get('preferences')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Minhas preferências de notificação (opt-in/out)' })
  listPreferences(@Req() req: ReqWithUser) {
    return this.settings.listPreferences(this.userId(req));
  }

  @Patch('preferences')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Altera opt-in de um evento/canal' })
  upsertPreference(
    @Req() req: ReqWithUser,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.settings.upsertPreference(this.userId(req), dto);
  }

  @Get('telegram/status')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Telegram vinculado?' })
  telegramStatus(@Req() req: ReqWithUser) {
    return this.settings.telegramStatus(this.userId(req));
  }

  @Get('telegram/link')
  @UseGuards(BearerAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Gera link t.me para vincular Telegram' })
  telegramLink(@Req() req: ReqWithUser) {
    return this.settings.createTelegramLink(this.userId(req));
  }

  @Post('telegram/webhook')
  @ApiOperation({ summary: 'Webhook do bot Telegram (captura /start)' })
  async telegramWebhook(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: unknown,
  ) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (expected && secret !== expected) throw new ForbiddenException();
    return this.settings.handleTelegramWebhook(update);
  }
}
