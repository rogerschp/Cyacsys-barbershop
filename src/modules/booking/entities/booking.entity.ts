import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, } from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { BarberProfileEntity } from '../../barber-profile/entities/barber-profile.entity';
import { ServiceEntity } from '../../service/entities/service.entity';
import { TenantUserEntity } from '../../tenant-user/entities/tenant-user.entity';
import { BookingStatus } from './booking-status.enum';
@Entity('bookings')
@Index('IDX_bookings_tenant_id', ['tenantId'])
@Index('IDX_bookings_barber_starts', ['barberProfileId', 'startsAt'])
export class BookingEntity {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;
    @Column({ name: 'tenant_id' })
    @ApiProperty()
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
    @Column({ name: 'service_id' })
    @ApiProperty()
    serviceId: string;
    @ManyToOne(() => ServiceEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'service_id' })
    service: ServiceEntity;
    @Column({ name: 'starts_at', type: 'timestamptz' })
    @ApiProperty({ description: 'Início do agendamento (instante absoluto UTC)' })
    startsAt: Date;
    @Column({ name: 'ends_at', type: 'timestamptz' })
    @ApiProperty({ description: 'Fim exclusivo / fim do serviço' })
    endsAt: Date;
    @Column({
        type: 'enum',
        enum: BookingStatus,
        enumName: 'bookings_status_enum',
        default: BookingStatus.DRAFT,
    })
    @ApiProperty({ enum: BookingStatus })
    status: BookingStatus;
    @Column({ name: 'created_by_tenant_user_id', type: 'uuid', nullable: true })
    @ApiProperty({
        nullable: true,
        description: 'Membro do tenant que criou o rascunho',
    })
    createdByTenantUserId: string | null;
    @ManyToOne(() => TenantUserEntity, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_by_tenant_user_id' })
    createdByTenantUser?: TenantUserEntity | null;
    @CreateDateColumn()
    @ApiProperty()
    createdAt: Date;
    @UpdateDateColumn()
    @ApiProperty()
    updatedAt: Date;
}
