import { ApiProperty } from '@nestjs/swagger';

export class AuthLoginResponseDto {
  @ApiProperty({ description: 'Firebase ID token (JWT)' })
  idToken: string;

  @ApiProperty({ description: 'Refresh token para obter novo idToken' })
  refreshToken: string;

  @ApiProperty({ description: 'Tempo de expiração do idToken em segundos' })
  expiresIn: number;
}
