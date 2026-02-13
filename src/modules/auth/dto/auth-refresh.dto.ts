import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthRefreshDto {
  @ApiProperty({ description: 'Refresh token retornado no login' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
