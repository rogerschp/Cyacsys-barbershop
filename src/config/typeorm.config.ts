import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

function resolveSsl(
  configService: ConfigService,
): boolean | { rejectUnauthorized: boolean } | undefined {
  const flag = (
    configService.get<string>('DB_SSL') ??
    configService.get<string>('DB_SSLMODE') ??
    ''
  )
    .trim()
    .toLowerCase();

  // Neon / managed Postgres exigem TLS (`sslmode=require`).
  if (['true', '1', 'require', 'verify-full', 'verify-ca'].includes(flag)) {
    // rejectUnauthorized: false evita falha de CA em runtimes gerenciados (Render + Neon).
    return { rejectUnauthorized: false };
  }

  if (['false', '0', 'disable'].includes(flag)) {
    return false;
  }

  return undefined;
}

export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const ssl = resolveSsl(configService);

  const base: DataSourceOptions = {
    type: 'postgres',
    synchronize: false,
    entities: [
      join(__dirname, '..', '**', '*.entity.{ts,js}'),
      join(__dirname, '..', '**', '*.view.{ts,js}'),
    ],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
    subscribers: [join(__dirname, '..', '**', '*.subscriber.{ts,js}')],
    migrationsRun: false,
    logging:
      configService.get<string>('NODE_ENV') === 'production'
        ? ['error', 'warn', 'migration']
        : true,
    extra: {
      max: 20,
    },
    ...(ssl !== undefined ? { ssl } : {}),
  };

  if (databaseUrl) {
    return {
      ...base,
      url: databaseUrl,
    };
  }

  return {
    ...base,
    host: configService.get<string>('DB_HOST'),
    port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
  };
};

const configService = new ConfigService();
const AppDataSource = new DataSource(getTypeOrmConfig(configService));
export default AppDataSource;
