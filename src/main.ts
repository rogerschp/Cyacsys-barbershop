import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('CORS');
  const isDev = process.env.NODE_ENV !== 'production';
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin:
      corsOrigins.length > 0
        ? (origin, callback) => {
            if (!origin || corsOrigins.includes(origin)) {
              return callback(null, true);
            }
            if (isDev && isLocalDevOrigin(origin)) {
              return callback(null, true);
            }
            if (isDev) {
              logger.warn(
                `Origin rejected: ${origin}. Set CORS_ORIGINS or use localhost/127.0.0.1.`,
              );
            }
            return callback(null, false);
          }
        : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Tenant'],
    maxAge: 86400,
  });

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const config = new DocumentBuilder()
    .setTitle('Cyacsys API — Profissionais de estética')
    .setDescription(
      'API multi-tenant: perfil profissional global, vínculo por estabelecimento, agenda contextual e agendamentos (bookingMode: DIRECT_BOOKING, QUOTE_REQUIRED, WHATSAPP_ONLY).',
    )
    .setVersion('2.0')
    .addTag('auth')
    .addTag('users')
    .addTag('professional-profile')
    .addTag('tenant-professionals')
    .addTag('tenants')
    .addTag('tenant-user')
    .addTag('services')
    .addTag('availability')
    .addTag('booking')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .build();
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.EXPOSE_SWAGGER === 'true'
  ) {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
