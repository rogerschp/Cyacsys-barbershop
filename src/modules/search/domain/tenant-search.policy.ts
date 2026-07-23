import { PlanFeature } from 'src/modules/subscription/enums/plan-feature.enum';

export type SearchOrderDirection = 'ASC' | 'DESC';

export interface TenantSearchOrderClause {
  field: string;
  direction: SearchOrderDirection;
}

export interface RegionalHighlightFeatureFilter {
  sql: string;
  params: { regionalHighlightFeature: string };
}

/**
 * Critério de filtro por feature de destaque regional no JSONB do plano.
 * Usa o vocabulário DDD de Subscription (`PlanFeature.REGIONAL_HIGHLIGHT`).
 */
export function buildRegionalHighlightFeatureFilter(
  enabled: boolean,
): RegionalHighlightFeatureFilter {
  const featureJson = JSON.stringify({
    [PlanFeature.REGIONAL_HIGHLIGHT]: enabled,
  });

  return {
    sql: 'p.features @> :regionalHighlightFeature::jsonb',
    params: { regionalHighlightFeature: featureJson },
  };
}

/**
 * Ordenação de descoberta:
 * - com filtro regionalHighlight → nota primeiro (tela de destaques)
 * - sem filtro → peso do plano (marketplace)
 */
export function resolveTenantSearchOrdering(options: {
  regionalHighlight?: boolean;
  hasCoordinates: boolean;
}): TenantSearchOrderClause[] {
  const highlightMode = options.regionalHighlight !== undefined;

  const clauses: TenantSearchOrderClause[] = highlightMode
    ? [
        { field: 'average_rating', direction: 'DESC' },
        { field: 'total_reviews', direction: 'DESC' },
        { field: 'p.sort_weight', direction: 'DESC' },
      ]
    : [
        { field: 'p.sort_weight', direction: 'DESC' },
        { field: 'average_rating', direction: 'DESC' },
      ];

  if (options.hasCoordinates) {
    clauses.push({ field: 'distance_km', direction: 'ASC' });
  }

  return clauses;
}
