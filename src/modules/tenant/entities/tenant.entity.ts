import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  @ApiProperty({
    example: 'barbearia-do-vitinho',
    description: 'The slug of the tenant',
  })
  slug: string;

  @Column()
  @ApiProperty({
    example: 'Barbearia do Vitinho',
    description: 'The name of the tenant',
  })
  name: string;

  @CreateDateColumn()
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: 'The date and time the tenant was created',
  })
  createdAt: Date;

  @DeleteDateColumn()
  @ApiProperty({
    example: '2021-01-01T00:00:00.000Z',
    description: 'The date and time the tenant was deleted',
    nullable: true,
  })
  deletedAt?: Date;
}
