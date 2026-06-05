import { SetMetadata } from '@nestjs/common';
import { PlanFeature } from '../enums/plan-feature.enum';

export const REQUIRES_PLAN_KEY = 'requiresPlan';

export const RequiresPlan = (...features: PlanFeature[]) =>
  SetMetadata(REQUIRES_PLAN_KEY, features);
