import { TenantSegment } from 'src/common/enums/tenant-segment.enum';

export interface SearchResult {
  id: string;
  name: string;
  avatarUrl: string | null;
  averageRating: number;
  totalReviews: number;
  distanceKm: number | null;
}

export interface TenantSearchResult extends SearchResult {
  slug: string;
  segment: TenantSegment | null;
  city: string | null;
  plan: {
    name: string;
    eliteBadge: boolean;
    regionalHighlight: boolean;
  };
}

export interface TenantSearchResponse {
  data: TenantSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
