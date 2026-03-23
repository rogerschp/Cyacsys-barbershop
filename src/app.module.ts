import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BarberProfileModule } from './modules/barber-profile/barber-profile.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { ServiceModule } from './modules/service/service.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantUserModule } from './modules/tenant-user/tenant-user.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
      inject: [ConfigService],
    }),
    FirebaseModule,
    AuthModule,
    TenantModule,
    TenantUserModule,
    ServiceModule,
    BarberProfileModule,
    AvailabilityModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
