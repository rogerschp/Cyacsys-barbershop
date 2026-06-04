import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingCycle } from '../enums/billing-cycle.enum';
import { PlanName } from '../enums/plan-name.enum';
import { PlanFeatures } from './plan-features.interface';

@Entity('plans')
export class PlanEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({
    type: 'enum',
    enum: PlanName,
    enumName: 'plans_name_enum',
    unique: true,
  })
  @ApiProperty({ enum: PlanName, example: PlanName.STANDARD })
  name: PlanName;

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: BillingCycle,
    enumName: 'plans_billing_cycle_enum',
  })
  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ example: '89.90' })
  price: string;

  @Column({ name: 'sort_weight', type: 'int' })
  @ApiProperty({ example: 1 })
  sortWeight: number;

  @Column({ name: 'grace_period_days', type: 'int' })
  @ApiProperty({ example: 5 })
  gracePeriodDays: number;

  @Column({ type: 'jsonb' })
  @ApiProperty({ description: 'Feature flags do plano' })
  features: PlanFeatures;

  @Column({ name: 'is_active', default: true })
  @ApiProperty({ example: true })
  isActive: boolean;

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
