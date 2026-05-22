import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { TenantProfessionalEntity } from '../../tenant-professional/entities/tenant-professional.entity';
import { ServiceEntity } from '../../service/entities/service.entity';

@Entity('professional_service_links')
@Index('IDX_professional_service_links_tenant_id', ['tenantId'])
@Index('IDX_professional_service_links_tenant_professional_id', [
  'tenantProfessionalId',
])
export class ProfessionalServiceLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_professional_id' })
  tenantProfessionalId: string;

  @ManyToOne(() => TenantProfessionalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_professional_id' })
  tenantProfessional: TenantProfessionalEntity;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => ServiceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ name: 'is_active', default: true })
  @ApiProperty()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
