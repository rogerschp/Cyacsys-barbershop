import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';
import { TenantStatus } from './tenant-status.enum';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Index({ unique: true })
  @Column()
  @ApiProperty({
    example: 'barbearia-do-vitinho',
    description:
      'Identidade pública na URL. Único globalmente e imutável após criação.',
  })
  slug: string;

  @Column()
  @ApiProperty({
    example: 'Barbearia do Vitinho',
    description: 'Nome da barbearia',
  })
  name: string;

  @Index()
  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  @ApiProperty({
    enum: TenantStatus,
    description:
      'ACTIVE = operação normal; INACTIVE = desativado; SUSPENDED = bloqueio (inadimplência/manual)',
  })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 64, default: 'America/Sao_Paulo' })
  @ApiProperty({
    example: 'America/Sao_Paulo',
    description: 'IANA timezone para datas/horários de agenda (ex.: slots)',
  })
  timezone: string;

  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({
    nullable: true,
    description: 'Soft delete; slug nunca é reutilizado',
  })
  deletedAt?: Date;

  // --- Campos futuros (white-label / plano) ---
  // @Column({ nullable: true }) primaryColor?: string;
  // @Column({ nullable: true }) secondaryColor?: string;
  // @Column({ nullable: true }) logoUrl?: string;
  // @Column({ nullable: true }) domainCustom?: string;
}
