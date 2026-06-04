export type ReportsLevel = 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
export type CustomizationLevel = 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'FULL';

export interface PlanFeatures {
  reports: ReportsLevel;
  reportExport: boolean;
  reviews: boolean;
  marketplace: boolean;
  regionalHighlight: boolean;
  eliteBadge: boolean;
  whatsappNotification: boolean;
  customization: CustomizationLevel;
  maxProfessionals: number | null;
}
