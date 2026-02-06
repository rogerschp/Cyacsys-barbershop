import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { TenantRepository } from '../../repository/tenant/tenant.repository';
import { TenantService } from './tenant.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity])],
  providers: [TenantRepository, TenantService],
  exports: [TenantService],
})
export class TenantModule {}
