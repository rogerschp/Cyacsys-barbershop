import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { IServiceRepository, SERVICE_REPOSITORY, } from '../../service/interfaces/service-repository.interface';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { CreateBarberServiceLinkDto } from '../dto/create-barber-service-link.dto';
import { BarberServiceLinkEntity } from '../entities/barber-service-link.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
@Injectable()
export class CreateBarberServiceLinkUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository, 
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository, private readonly tenantUserService: TenantUserService) { }
    async run(tenantId: string, barberProfileId: string, dto: CreateBarberServiceLinkDto, userId: string, callerRole?: string): Promise<BarberServiceLinkEntity> {
        await assertBarberAgendaAccess({
            tenantId,
            barberProfileId,
            userId,
            callerRole,
            barberProfileRepository: this.barberProfileRepository,
            tenantUserService: this.tenantUserService,
        });
        const service = await this.serviceRepository.findById(dto.serviceId, tenantId);
        if (!service) {
            throw new BusinessRuleException('SERVICE_NOT_FOUND', 'Serviço não encontrado neste tenant.');
        }
        if (!service.isActive) {
            throw new BusinessRuleException('SERVICE_INACTIVE', 'Só é possível vincular serviços ativos do tenant.');
        }
        const existing = await this.availabilityRepository.findBarberServiceLinkByBarberAndService(barberProfileId, tenantId, dto.serviceId);
        if (existing) {
            throw new BusinessRuleException('BARBER_SERVICE_ALREADY_EXISTS', 'Este serviço já está vinculado ao barbeiro.');
        }
        return this.availabilityRepository.createBarberServiceLink({
            tenantId,
            barberProfileId,
            serviceId: dto.serviceId,
        });
    }
}
