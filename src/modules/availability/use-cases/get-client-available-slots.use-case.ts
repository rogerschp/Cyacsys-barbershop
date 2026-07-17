import { Injectable } from '@nestjs/common';
import { AvailableSlotsResponseDto } from '../dto/available-slots-response.dto';
import { ResolveAvailableSlotsUseCase } from './resolve-available-slots.use-case';

/** Slots para cliente autenticado sem membership no tenant. */
@Injectable()
export class GetClientAvailableSlotsUseCase {
  constructor(
    private readonly resolveAvailableSlotsUseCase: ResolveAvailableSlotsUseCase,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    serviceId: string,
    dateYmd: string,
  ): Promise<AvailableSlotsResponseDto> {
    return this.resolveAvailableSlotsUseCase.run(
      tenantId,
      tenantProfessionalId,
      serviceId,
      dateYmd,
    );
  }
}
