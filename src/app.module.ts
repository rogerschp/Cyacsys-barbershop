import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { getTypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingModule } from './modules/booking/booking.module';
import { ProfessionalProfileModule } from './modules/professional-profile/professional-profile.module';
import { TenantProfessionalModule } from './modules/tenant-professional/tenant-professional.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { ServiceModule } from './modules/service/service.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantUserModule } from './modules/tenant-user/tenant-user.module';
import { UserModule } from './modules/user/user.module';
import { ReviewModule } from './modules/review/review.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
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
    ProfessionalProfileModule,
    TenantProfessionalModule,
    AvailabilityModule,
    BookingModule,
    UserModule,
    ReviewModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
