import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn, } from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { BarberProfileEntity } from '../../barber-profile/entities/barber-profile.entity';
import { ServiceEntity } from '../../service/entities/service.entity';
@Entity('barber_services')
@Index('IDX_barber_services_tenant_id', ['tenantId'])
@Index('IDX_barber_services_barber_profile_id', ['barberProfileId'])
export class BarberServiceLinkEntity {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty()
    id: string;
    @Column({ name: 'tenant_id' })
    tenantId: string;
    @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: TenantEntity;
    @Column({ name: 'barber_profile_id' })
    barberProfileId: string;
    @ManyToOne(() => BarberProfileEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'barber_profile_id' })
    barberProfile: BarberProfileEntity;
    @Column({ name: 'service_id' })
    serviceId: string;
    @ManyToOne(() => ServiceEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'service_id' })
    service: ServiceEntity;
    @Column({ name: 'is_active', default: true })
    @ApiProperty()
    isActive: boolean;
    @CreateDateColumn()
    createdAt: Date;
    @DeleteDateColumn()
    deletedAt?: Date;
}
