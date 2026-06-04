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
} from 'typeorm';
import { SubscriptionEvent } from '../enums/subscription-event.enum';
import { TenantSubscriptionEntity } from './tenant-subscription.entity';

@Entity('subscription_histories')
@Index('IDX_subscription_histories_tenant_id', ['tenantId'])
export class SubscriptionHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({ name: 'tenant_id' })
  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @Column({ name: 'subscription_id' })
  @ApiProperty({ description: 'ID da assinatura' })
  subscriptionId: string;

  @ManyToOne(() => TenantSubscriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: TenantSubscriptionEntity;

  @Column({
    type: 'enum',
    enum: SubscriptionEvent,
    enumName: 'subscription_histories_event_enum',
  })
  @ApiProperty({ enum: SubscriptionEvent, example: SubscriptionEvent.CREATED })
  event: SubscriptionEvent;

  @Column({ name: 'from_plan_id', nullable: true })
  @ApiProperty({ nullable: true })
  fromPlanId: string | null;

  @Column({ name: 'to_plan_id', nullable: true })
  @ApiProperty({ nullable: true })
  toPlanId: string | null;

  @Column({ name: 'performed_by' })
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  performedBy: string;

  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ nullable: true })
  deletedAt?: Date;
}
