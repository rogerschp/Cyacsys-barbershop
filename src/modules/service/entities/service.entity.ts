import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';

@Entity('services')
@Index('IDX_services_tenant_id', ['tenantId'])
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @Column({ name: 'tenant_id' })
  @ApiProperty({ description: 'ID do tenant' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column()
  @ApiProperty({
    example: 'Corte masculino',
    description: 'Nome do serviço (único por tenant entre ativos)',
  })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    nullable: true,
    example: 'Corte moderno com máquina e tesoura',
    description: 'Descrição opcional do serviço',
  })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({
    example: 45.0,
    description: 'Preço do serviço (>= 0)',
  })
  price: string;

  @Column({ name: 'duration_in_minutes', type: 'int' })
  @ApiProperty({
    example: 30,
    description: 'Duração em minutos (>= 5)',
  })
  durationInMinutes: number;

  @Column({ name: 'is_active', default: true })
  @ApiProperty({
    example: true,
    description: 'Se o serviço está ativo para agendamento',
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
    description: 'Soft delete; preenchido quando o serviço é excluído',
  })
  deletedAt?: Date;
}
