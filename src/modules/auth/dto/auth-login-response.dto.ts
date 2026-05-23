import { ApiProperty } from '@nestjs/swagger';
import { AuthTokensDto } from './auth-tokens.dto';

export class AuthLoginResponseDto extends AuthTokensDto {
  @ApiProperty({
    description: 'Nome de exibição do usuário (campo name no cadastro)',
    example: 'João Silva',
  })
  username: string;
}
