import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { DevicePlatform } from '../domain/device-platform.enum';
import { NotificationChannel } from '../domain/notification-channel.enum';
import { NotificationEvent } from '../domain/notification-event.enum';

export class RegisterDeviceTokenDto {
  @ApiProperty({ example: 'fcm-token...' })
  @IsString() @MaxLength(512)
  token: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(128)
  deviceId?: string;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ enum: NotificationEvent })
  @IsEnum(NotificationEvent)
  event: NotificationEvent;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
