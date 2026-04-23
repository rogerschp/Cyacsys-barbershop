import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn, OneToMany, } from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { BarberProfileEntity } from '../../barber-profile/entities/barber-profile.entity';
import { DayOfWeek } from './day-of-week.enum';
import { WorkingHoursPeriodEntity } from './working-hours-period.entity';
@Entity('working_hours')
@Index('IDX_working_hours_tenant_id', ['tenantId'])
@Index('IDX_working_hours_barber_profile_id', ['barberProfileId'])
export class WorkingHoursEntity {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty()
    id: string;
    @Column({ name: 'tenant_id' })
    @ApiProperty({ description: 'ID do tenant (desnormalizado)' })
    tenantId: string;
    @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: TenantEntity;
    @Column({ name: 'barber_profile_id' })
    @ApiProperty()
    barberProfileId: string;
    @ManyToOne(() => BarberProfileEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'barber_profile_id' })
    barberProfile: BarberProfileEntity;
    @Column({ name: 'day_of_week', type: 'varchar', length: 16 })
    @ApiProperty({ enum: DayOfWeek })
    dayOfWeek: DayOfWeek;
    @Column({ name: 'is_active', default: true })
    @ApiProperty()
    isActive: boolean;
    @OneToMany(() => WorkingHoursPeriodEntity, (p) => p.workingHours, {
        cascade: false,
    })
    periods?: WorkingHoursPeriodEntity[];
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @DeleteDateColumn()
    deletedAt?: Date;
}
