import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { ProfessionalProfileEntity } from '../../professional-profile/entities/professional-profile.entity';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from './tenant-professional-status.enum';

@Entity('tenant_professionals')
@Index('IDX_tenant_professionals_tenant_id', ['tenantId'])
@Index('IDX_tenant_professionals_professional_profile_id', [
  'professionalProfileId',
])
export class TenantProfessionalEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({ name: 'tenant_id' })
  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'professional_profile_id' })
  @ApiProperty({ description: 'ID do perfil profissional global' })
  professionalProfileId: string;

  @ManyToOne(() => ProfessionalProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professional_profile_id' })
  professionalProfile: ProfessionalProfileEntity;

  @Column({
    type: 'enum',
    enum: TenantUserRole,
    enumName: 'tenant_professionals_role_enum',
  })
  @ApiProperty({
    enum: TenantUserRole,
    description: 'Papel operacional do profissional neste tenant',
  })
  role: TenantUserRole;

  @Column({
    type: 'enum',
    enum: TenantProfessionalStatus,
    enumName: 'tenant_professionals_status_enum',
    default: TenantProfessionalStatus.ACTIVE,
  })
  @ApiProperty({ enum: TenantProfessionalStatus })
  status: TenantProfessionalStatus;

  @Column({ name: 'joined_at', type: 'timestamptz' })
  @ApiProperty({ description: 'Data de entrada no tenant' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  @ApiProperty({
    nullable: true,
    description: 'Data de saída do tenant (quando status = LEFT)',
  })
  leftAt: Date | null;

  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;
}
