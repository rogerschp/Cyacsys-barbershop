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
import { TenantUserEntity } from '../../tenant-user/entities/tenant-user.entity';
@Entity('barber_profiles')
@Index('IDX_barber_profiles_tenant_id', ['tenantId'])
export class BarberProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @Column({ name: 'tenant_id' })
  @ApiProperty({ description: 'ID do tenant (desnormalizado para queries)' })
  tenantId: string;
  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
  @Column({ name: 'tenant_user_id' })
  @ApiProperty({
    description:
      'FK para TenantUser; um tenantUserId só pode ter um perfil por tenant',
  })
  tenantUserId: string;
  @ManyToOne(() => TenantUserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_user_id' })
  tenantUser: TenantUserEntity;
  @Column({ name: 'display_name', length: 255 })
  @ApiProperty({ example: 'João Barbeiro', description: 'Nome de exibição' })
  displayName: string;
  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    nullable: true,
    example: 'Especialista em cortes modernos',
    description: 'Bio opcional',
  })
  bio: string | null;
  @Column({ name: 'avatar_url' })
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL do avatar (obrigatório na criação)',
  })
  avatarUrl: string;
  @Column({ name: 'experience_years', type: 'int' })
  @ApiProperty({
    example: 5,
    description: 'Anos de experiência (>= 0)',
  })
  experienceYears: number;
  @Column({ name: 'is_active', default: true })
  @ApiProperty({
    example: true,
    description: 'Barbeiro ativo pode receber agendamentos',
  })
  isActive: boolean;
  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;
  @UpdateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
  @DeleteDateColumn()
  @ApiProperty({
    nullable: true,
    description: 'Soft delete; deletados não aparecem em listagens',
  })
  deletedAt?: Date;
}
