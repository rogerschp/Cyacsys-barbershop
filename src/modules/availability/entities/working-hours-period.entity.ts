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
import { WorkingHoursEntity } from './working-hours.entity';

@Entity('working_hours_periods')
@Index('IDX_working_hours_periods_wh_id', ['workingHoursId'])
export class WorkingHoursPeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ name: 'working_hours_id' })
  @ApiProperty()
  workingHoursId: string;

  @ManyToOne(() => WorkingHoursEntity, (wh) => wh.periods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'working_hours_id' })
  workingHours: WorkingHoursEntity;

  /** Horário local do tenant (HH:mm) */
  @Column({ name: 'start_time', length: 5 })
  @ApiProperty({ example: '09:00' })
  startTime: string;

  @Column({ name: 'end_time', length: 5 })
  @ApiProperty({ example: '12:00' })
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
