import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { RolesGuard } from './guards/roles.guard';
import { FirebaseStrategy } from './strategies/firebase.strategy';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, FirebaseStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}
