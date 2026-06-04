import { Inject, Injectable } from '@nestjs/common';
import { PlanResponseDto } from '../dto/plan-response.dto';
import {
  IPlanRepository,
  PLAN_REPOSITORY,
} from '../interfaces/plan-repository.interface';
import { toPlanResponseDto } from '../mappers/subscription.mapper';

@Injectable()
export class GetPlansUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly planRepository: IPlanRepository,
  ) {}

  async run(): Promise<PlanResponseDto[]> {
    const plans = await this.planRepository.findAllActive();
    return plans.map(toPlanResponseDto);
  }
}
