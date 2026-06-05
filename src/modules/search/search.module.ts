import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenant/entities/tenant.entity';
import { SearchController } from './controllers/search.controller';
import { SearchTenantsUseCase } from './use-cases/search-tenants.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity])],
  controllers: [SearchController],
  providers: [SearchTenantsUseCase],
  exports: [SearchTenantsUseCase],
})
export class SearchModule {}
