import { PlanFeature } from 'src/modules/subscription/enums/plan-feature.enum';
import {
  buildRegionalHighlightFeatureFilter,
  resolveTenantSearchOrdering,
} from 'src/modules/search/domain/tenant-search.policy';

describe('tenant-search.policy', () => {
  describe('buildRegionalHighlightFeatureFilter', () => {
    it('monta predicado JSONB com PlanFeature.REGIONAL_HIGHLIGHT = true', () => {
      const filter = buildRegionalHighlightFeatureFilter(true);

      expect(filter.sql).toBe('p.features @> :regionalHighlightFeature::jsonb');
      expect(JSON.parse(filter.params.regionalHighlightFeature)).toEqual({
        [PlanFeature.REGIONAL_HIGHLIGHT]: true,
      });
    });

    it('monta predicado JSONB com PlanFeature.REGIONAL_HIGHLIGHT = false', () => {
      const filter = buildRegionalHighlightFeatureFilter(false);

      expect(JSON.parse(filter.params.regionalHighlightFeature)).toEqual({
        [PlanFeature.REGIONAL_HIGHLIGHT]: false,
      });
    });
  });

  describe('resolveTenantSearchOrdering', () => {
    it('usa peso do plano primeiro no marketplace (sem filtro)', () => {
      expect(
        resolveTenantSearchOrdering({ hasCoordinates: false }),
      ).toEqual([
        { field: 'p.sort_weight', direction: 'DESC' },
        { field: 'average_rating', direction: 'DESC' },
      ]);
    });

    it('prioriza nota e reviews no modo destaques', () => {
      expect(
        resolveTenantSearchOrdering({
          regionalHighlight: true,
          hasCoordinates: false,
        }),
      ).toEqual([
        { field: 'average_rating', direction: 'DESC' },
        { field: 'total_reviews', direction: 'DESC' },
        { field: 'p.sort_weight', direction: 'DESC' },
      ]);
    });

    it('inclui distância quando há coordenadas', () => {
      expect(
        resolveTenantSearchOrdering({
          regionalHighlight: true,
          hasCoordinates: true,
        }),
      ).toEqual([
        { field: 'average_rating', direction: 'DESC' },
        { field: 'total_reviews', direction: 'DESC' },
        { field: 'p.sort_weight', direction: 'DESC' },
        { field: 'distance_km', direction: 'ASC' },
      ]);
    });
  });
});
