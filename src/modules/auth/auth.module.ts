import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserRolesGuard } from '../../common/guards/user-roles.guard';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './guards/bearer-auth.guard';
import { AUTH_PROVIDER } from './interfaces/auth-provider.interface';
import { TOKEN_VERIFIER } from './interfaces/token-verifier.interface';
import { FirebaseAuthProvider } from './providers/firebase/firebase-auth-provider.service';
import { FirebaseTokenVerifier } from './providers/firebase/firebase-token-verifier.service';
import { BearerTokenStrategy } from './strategies/bearer-token.strategy';
@Module({
  imports: [PassportModule, forwardRef(() => UserModule)],
  controllers: [AuthController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: FirebaseTokenVerifier },
    { provide: AUTH_PROVIDER, useClass: FirebaseAuthProvider },
    AuthService,
    BearerTokenStrategy,
    BearerAuthGuard,
    UserRolesGuard,
  ],
  exports: [AuthService, UserRolesGuard, BearerAuthGuard],
})
export class AuthModule {}
