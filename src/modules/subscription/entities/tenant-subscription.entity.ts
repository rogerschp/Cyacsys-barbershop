import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { PlanEntity } from './plan.entity';

@Entity('tenant_subscriptions')
@Index('UQ_tenant_subscriptions_tenant_id', ['tenantId'], { unique: true })
export class TenantSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({ name: 'tenant_id' })
  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'plan_id' })
  @ApiProperty({ description: 'ID do plano' })
  planId: string;

  @ManyToOne(() => PlanEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: PlanEntity;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    enumName: 'tenant_subscriptions_status_enum',
  })
  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  @ApiProperty({ nullable: true })
  currentPeriodStart: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  @ApiProperty({ nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'grace_period_end', type: 'timestamp', nullable: true })
  @ApiProperty({ nullable: true })
  gracePeriodEnd: Date | null;

  @Column({ name: 'gateway_customer_id', nullable: true })
  @ApiProperty({ nullable: true })
  gatewayCustomerId: string | null;

  @Column({ name: 'gateway_sub_id', nullable: true })
  @ApiProperty({ nullable: true })
  gatewaySubId: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'activated_by', nullable: true })
  @ApiProperty({ nullable: true })
  activatedBy: string | null;

  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ nullable: true })
  deletedAt?: Date;
}
