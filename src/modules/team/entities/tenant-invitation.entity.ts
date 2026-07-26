import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantInvitationStatus } from '../enums/tenant-invitation-status.enum';

@Entity('tenant_invitations')
@Index('UQ_tenant_invitations_token', ['token'], { unique: true })
@Index('IDX_tenant_invitations_tenant_email', ['tenantId', 'email'])
export class TenantInvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'varchar', length: 320 })
  email: string;

  @Column({ type: 'enum', enum: TenantUserRole })
  role: TenantUserRole;

  @Column({ type: 'enum', enum: TenantInvitationStatus })
  status: TenantInvitationStatus;

  @Column({ type: 'varchar', length: 64 })
  token: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
