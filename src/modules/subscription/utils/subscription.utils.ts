import { PlanFeatures } from '../entities/plan-features.interface';
import { BillingCycle } from '../enums/billing-cycle.enum';
import { PlanFeature } from '../enums/plan-feature.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

const REPORTS_LEVELS = ['NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED'] as const;
const CUSTOMIZATION_LEVELS = ['NONE', 'BASIC', 'INTERMEDIATE', 'FULL'] as const;

export function isSubscriptionAccessAllowed(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): boolean {
  if (status === SubscriptionStatus.ACTIVE) {
    return true;
  }
  if (status === SubscriptionStatus.GRACE_PERIOD) {
    return true;
  }
  if (status === SubscriptionStatus.CANCELLED) {
    return currentPeriodEnd === null || currentPeriodEnd >= now;
  }
  return false;
}

export function isPlanFeatureEnabled(
  features: PlanFeatures,
  feature: PlanFeature,
): boolean {
  switch (feature) {
    case PlanFeature.REVIEWS:
      return features.reviews;
    case PlanFeature.MARKETPLACE:
      return features.marketplace;
    case PlanFeature.REGIONAL_HIGHLIGHT:
      return features.regionalHighlight;
    case PlanFeature.ELITE_BADGE:
      return features.eliteBadge;
    case PlanFeature.WHATSAPP_NOTIFICATION:
      return features.whatsappNotification;
    case PlanFeature.REPORT_EXPORT:
      return features.reportExport;
    case PlanFeature.REPORTS_BASIC:
      return (
        REPORTS_LEVELS.indexOf(features.reports) >=
        REPORTS_LEVELS.indexOf('BASIC')
      );
    case PlanFeature.REPORTS_INTERMEDIATE:
      return (
        REPORTS_LEVELS.indexOf(features.reports) >=
        REPORTS_LEVELS.indexOf('INTERMEDIATE')
      );
    case PlanFeature.REPORTS_ADVANCED:
      return features.reports === 'ADVANCED';
    case PlanFeature.CUSTOMIZATION_BASIC:
      return (
        CUSTOMIZATION_LEVELS.indexOf(features.customization) >=
        CUSTOMIZATION_LEVELS.indexOf('BASIC')
      );
    case PlanFeature.CUSTOMIZATION_INTERMEDIATE:
      return (
        CUSTOMIZATION_LEVELS.indexOf(features.customization) >=
        CUSTOMIZATION_LEVELS.indexOf('INTERMEDIATE')
      );
    case PlanFeature.CUSTOMIZATION_FULL:
      return features.customization === 'FULL';
    default:
      return false;
  }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculatePeriodEnd(
  start: Date,
  billingCycle: BillingCycle,
): Date {
  if (billingCycle === BillingCycle.MONTHLY) {
    return addDays(start, 30);
  }
  if (billingCycle === BillingCycle.ANNUAL) {
    return addDays(start, 365);
  }
  return start;
}
