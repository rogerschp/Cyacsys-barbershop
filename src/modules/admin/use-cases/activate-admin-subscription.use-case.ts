import { Injectable } from '@nestjs/common';
import { ActivateSubscriptionDto } from '../../subscription/dto/activate-subscription.dto';
import { SubscriptionResponseDto } from '../../subscription/dto/subscription-response.dto';
import { ActivateSubscriptionUseCase } from '../../subscription/use-cases/activate-subscription.use-case';

@Injectable()
export class ActivateAdminSubscriptionUseCase {
  constructor(
    private readonly activateSubscriptionUseCase: ActivateSubscriptionUseCase,
  ) {}

  async run(
    dto: ActivateSubscriptionDto,
    activatedBy: string,
  ): Promise<SubscriptionResponseDto> {
    return this.activateSubscriptionUseCase.run(dto, activatedBy);
  }
}
