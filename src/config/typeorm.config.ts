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
  extra: {
    max: 20,
  },
});

const configService = new ConfigService();
const AppDataSource = new DataSource(getTypeOrmConfig(configService));
export default AppDataSource;
