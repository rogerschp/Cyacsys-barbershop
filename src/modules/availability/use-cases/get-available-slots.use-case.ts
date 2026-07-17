import { Inject, Injectable } from '@nestjs/common';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { AvailableSlotsResponseDto } from '../dto/available-slots-response.dto';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { ResolveAvailableSlotsUseCase } from './resolve-available-slots.use-case';

@Injectable()
export class GetAvailableSlotsUseCase {
  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
    private readonly resolveAvailableSlotsUseCase: ResolveAvailableSlotsUseCase,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    serviceId: string,
    dateYmd: string,
    userId: string,
    callerRole?: string,
  ): Promise<AvailableSlotsResponseDto> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });
    return this.resolveAvailableSlotsUseCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
    );
  }
}
