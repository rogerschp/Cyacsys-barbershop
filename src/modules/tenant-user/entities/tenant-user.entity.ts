import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn, } from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { TenantUserRole } from './tenant-user-role.enum';
import { TenantUserStatus } from './tenant-user-status.enum';
@Entity('tenant_users')
@Index('UQ_tenant_users_tenant_id_user_id', ['tenantId', 'userId'], {
    unique: true,
})
export class TenantUserEntity {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;
    @Column({ name: 'tenant_id' })
    @ApiProperty({ description: 'ID do tenant' })
    tenantId: string;
    @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: TenantEntity;
    @Column({ name: 'user_id' })
    @ApiProperty({ description: 'ID do usuário' })
    userId: string;
    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
    @Column({ type: 'enum', enum: TenantUserRole })
    @ApiProperty({
        enum: TenantUserRole,
        description: 'Papel do usuário neste tenant (OWNER | ADMIN | BARBER | STAFF)',
    })
    role: TenantUserRole;
    @Column({
        type: 'enum',
        enum: TenantUserStatus,
        default: TenantUserStatus.ACTIVE,
    })
    @ApiProperty({
        enum: TenantUserStatus,
        description: 'Status do vínculo no tenant',
    })
    status: TenantUserStatus;
    @CreateDateColumn()
    @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
    createdAt: Date;
}
