import { ApiProperty } from '@nestjs/swagger';

export class AuthLogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}
