import { ApiProperty } from '@nestjs/swagger';

export class AuthRefreshResponseDto {
  @ApiProperty({ description: 'Novo Firebase ID token (JWT)' })
  idToken: string;

  @ApiProperty({ description: 'Refresh token (pode ser o mesmo ou novo)' })
  refreshToken: string;

  @ApiProperty({ description: 'Tempo de expiração do idToken em segundos' })
  expiresIn: number;
}
