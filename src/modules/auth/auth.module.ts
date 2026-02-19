import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AUTH_PROVIDER } from './ports/auth-provider.interface';
import { TOKEN_VERIFIER } from './ports/token-verifier.interface';
import { FirebaseAppInitializer } from './providers/firebase/firebase-app.initializer';
import { FirebaseAuthProvider } from './providers/firebase/firebase-auth-provider.service';
import { FirebaseTokenVerifier } from './providers/firebase/firebase-token-verifier.service';
import { BearerTokenStrategy } from './strategies/bearer-token.strategy';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [
    FirebaseAppInitializer,
    { provide: TOKEN_VERIFIER, useClass: FirebaseTokenVerifier },
    { provide: AUTH_PROVIDER, useClass: FirebaseAuthProvider },
    AuthService,
    BearerTokenStrategy,
    BearerAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
