import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  synchronize: false,
  entities: [
    join(__dirname, '..', '**', '*.entity.{ts,js}'),
    join(__dirname, '..', '**', '*.view.{ts,js}'),
  ],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  subscribers: [join(__dirname, '..', '**', '*.subscriber.{ts,js}')],
  migrationsRun: false,
  logging: true,
  // Enable loading entities in events for subscribers
  // This allows databaseEntity to be available in UpdateEvent
  extra: {
    max: 20,
  },
});

// For CLI migrations
const configService = new ConfigService();
const AppDataSource = new DataSource(getTypeOrmConfig(configService));
export default AppDataSource;
