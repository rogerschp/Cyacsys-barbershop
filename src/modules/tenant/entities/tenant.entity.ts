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
import { TenantStatus } from './tenant-status.enum';
import { AddressEntity } from 'src/modules/address/entities/address.entity';
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

  @Column()
  @ApiProperty({
    example: '5511992834085',
    description: 'Telefone para contato do usuario',
  })
  telephone: string;
  @Column({ name: 'address_id', nullable: true })
  @ApiProperty({ nullable: true, description: 'FK para o endereço do usuário' })
  addressId: string | null;

  @ManyToOne(() => AddressEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'address_id' })
  address: AddressEntity | null;

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

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({
    example: { instagram: '@vitinho_barber', facebook: 'barbeariavitinho' },
    description: 'Objeto contendo links ou handles de redes sociais',
    required: false,
    nullable: true,
  })
  socialMedia: Record<string, string> | null;

  @Column({ nullable: true, length: 14 })
  @ApiProperty({
    example: '12345678000199',
    description: 'CNPJ da barbearia (apenas números). Opcional.',
    required: false,
    nullable: true,
  })
  cnpj: string | null;
}
