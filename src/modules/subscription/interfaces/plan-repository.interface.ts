import { PlanEntity } from '../entities/plan.entity';
import { PlanName } from '../enums/plan-name.enum';

export interface IPlanRepository {
  findAllActive(): Promise<PlanEntity[]>;
  findByName(name: PlanName): Promise<PlanEntity | null>;
  findById(id: string): Promise<PlanEntity | null>;
}

export const PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');
