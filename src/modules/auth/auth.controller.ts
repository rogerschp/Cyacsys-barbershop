import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthLogoutResponseDto } from './dto/auth-logout-response.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import { AuthService } from './auth.service';
import { RequestUser } from './strategies/bearer-token.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiBody({ type: AuthLoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login realizado com sucesso',
    type: AuthLoginResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não encontrado no banco ou inativo',
  })
  async login(
    @Body() authLoginDto: AuthLoginDto,
  ): Promise<AuthLoginResponseDto> {
    return this.authService.authenticateWithUserCredentials(authLoginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar idToken usando refresh token' })
  @ApiBody({ type: AuthRefreshDto })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: AuthRefreshResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token ausente ou inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token expirado ou inválido',
  })
  async refresh(
    @Body() authRefreshDto: AuthRefreshDto,
  ): Promise<AuthRefreshResponseDto> {
    return this.authService.refreshToken(authRefreshDto);
  }

  @Post('logout')
  @UseGuards(BearerAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Logout (revoga refresh tokens do usuário)' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    type: AuthLogoutResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  async logout(
    @Req() req: Request & { user: RequestUser },
  ): Promise<AuthLogoutResponseDto> {
    await this.authService.logout(req.user.uid);
    return { message: 'Logged out successfully' };
  }
}
