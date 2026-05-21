import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { TenantProfessionalEntity } from '../../tenant-professional/entities/tenant-professional.entity';
import { TimeOffReason } from './time-off-reason.enum';

@Entity('professional_time_offs')
@Index('IDX_professional_time_offs_tenant_id', ['tenantId'])
@Index('IDX_professional_time_offs_tp_date', ['tenantProfessionalId', 'date'])
export class TimeOffEntity {
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

  @Column({ type: 'date' })
  @ApiProperty({ example: '2026-12-25' })
  date: string;

  @Column({ name: 'start_time', type: 'varchar', length: 5, nullable: true })
  @ApiProperty({ nullable: true, example: '09:00' })
  startTime: string | null;

  @Column({ name: 'end_time', type: 'varchar', length: 5, nullable: true })
  @ApiProperty({ nullable: true, example: '12:00' })
  endTime: string | null;

  @Column({ type: 'varchar', length: 32 })
  @ApiProperty({ enum: TimeOffReason })
  reason: TimeOffReason;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
