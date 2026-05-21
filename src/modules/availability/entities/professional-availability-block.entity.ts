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
import { BlockReason } from './block-reason.enum';

@Entity('professional_availability_blocks')
@Index('IDX_professional_availability_blocks_tenant_id', ['tenantId'])
@Index('IDX_professional_availability_blocks_tp_date', [
  'tenantProfessionalId',
  'date',
])
export class ProfessionalAvailabilityBlockEntity {
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
  @ApiProperty({ example: '2026-03-21' })
  date: string;

  @Column({ name: 'start_time', type: 'varchar', length: 5 })
  @ApiProperty({ example: '10:00' })
  startTime: string;

  @Column({ name: 'end_time', type: 'varchar', length: 5 })
  @ApiProperty({ example: '11:00' })
  endTime: string;

  @Column({ type: 'varchar', length: 32 })
  @ApiProperty({ enum: BlockReason })
  reason: BlockReason;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
