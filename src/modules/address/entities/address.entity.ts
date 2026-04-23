import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('addresses')
export class AddressEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @Column()
  @ApiProperty({ example: 'Rua 26 de marco' })
  street: string;
  @Column()
  @ApiProperty({ example: '882' })
  number: string;
  @Column()
  @ApiProperty({ example: 'Sao Paulo' })
  city: string;
  @Column()
  @ApiProperty({ example: 'SP' })
  state: string;
  @Column()
  @ApiProperty({ example: '04001-000' })
  zipCode: string;
  @Column()
  @ApiProperty({ example: 'Brazil' })
  country: string;
  @CreateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;
  @UpdateDateColumn()
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
  @DeleteDateColumn()
  @ApiProperty({
    nullable: true,
    description: 'Soft delete; preenchido quando o endereço é removido',
  })
  deletedAt?: Date;
}
