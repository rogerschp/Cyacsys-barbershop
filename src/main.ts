import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
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
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
