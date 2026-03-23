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
import { BarberProfileEntity } from '../../barber-profile/entities/barber-profile.entity';
import { BlockReason } from './block-reason.enum';

@Entity('barber_availability_blocks')
@Index('IDX_barber_availability_blocks_tenant_id', ['tenantId'])
@Index('IDX_barber_availability_blocks_barber_date', [
  'barberProfileId',
  'date',
])
export class BarberAvailabilityBlockEntity {
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

  @Column({ type: 'date' })
  @ApiProperty({ example: '2026-03-21' })
  date: string;

  @Column({ name: 'start_time', length: 5 })
  @ApiProperty({ example: '12:00' })
  startTime: string;

  @Column({ name: 'end_time', length: 5 })
  @ApiProperty({ example: '14:00' })
  endTime: string;

  @Column({ type: 'varchar', length: 32 })
  @ApiProperty({ enum: BlockReason })
  reason: BlockReason;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  @ApiProperty({ nullable: true })
  bookingId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
