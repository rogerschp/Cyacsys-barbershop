import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponseDto } from './dto/auth-login-reponse.dto';
import { AuthLogoutResponseDto } from './dto/auth-logout-response.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import { IDecodedToken } from './ports/decoded-token.interface';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login com email e senha' })
  async login(
    @Body() authLoginDto: AuthLoginDto,
  ): Promise<AuthLoginResponseDto> {
    return this.authService.authenticateWithUserCredentials(authLoginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renovar idToken usando refresh token' })
  async refresh(
    @Body() authRefreshDto: AuthRefreshDto,
  ): Promise<AuthRefreshResponseDto> {
    return this.authService.refreshToken(authRefreshDto);
  }

  @Post('logout')
  @UseGuards(BearerAuthGuard)
  @ApiOperation({ summary: 'Logout (revoga refresh tokens do usuário)' })
  async logout(
    @Req() req: Request & { user: IDecodedToken },
  ): Promise<AuthLogoutResponseDto> {
    await this.authService.logout(req.user.uid);
    return { message: 'Logged out successfully' };
  }
}
