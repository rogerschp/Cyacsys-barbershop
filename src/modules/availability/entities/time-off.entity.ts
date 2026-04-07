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
import { BarberProfileEntity } from '../../barber-profile/entities/barber-profile.entity';
import { TimeOffReason } from './time-off-reason.enum';

@Entity('barber_time_offs')
@Index('IDX_barber_time_offs_tenant_id', ['tenantId'])
@Index('IDX_barber_time_offs_barber_date', ['barberProfileId', 'date'])
export class TimeOffEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'barber_profile_id' })
  barberProfileId: string;

  @ManyToOne(() => BarberProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barber_profile_id' })
  barberProfile: BarberProfileEntity;

  /** Data civil no fuso do tenant (YYYY-MM-DD) */
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
