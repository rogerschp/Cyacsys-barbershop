import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { ReviewTargetType } from 'src/modules/review/entities/review-target-type.enum';
import { SubscriptionStatus } from 'src/modules/subscription/enums/subscription-status.enum';
import { TenantEntity } from 'src/modules/tenant/entities/tenant.entity';
import { SearchTenantsQueryDto } from '../dto/search-tenants-query.dto';
import {
  TenantSearchResponse,
  TenantSearchResult,
} from '../interfaces/search-result.interface';
import { PlanFeatures } from 'src/modules/subscription/entities/plan-features.interface';

interface TenantSearchRawRow {
  id: string;
  name: string;
  slug: string;
  segment: string | null;
  avatar_url: string | null;
  city: string | null;
  plan_name: string;
  plan_features: PlanFeatures;
  sort_weight: string;
  average_rating: string;
  total_reviews: string;
  distance_km: string | null;
}

const HAVERSINE_SQL = `(
  6371 * acos(
    LEAST(1.0, GREATEST(-1.0,
      cos(radians(:lat)) * cos(radians(CAST(t.latitude AS double precision))) *
      cos(radians(CAST(t.longitude AS double precision)) - radians(:lng)) +
      sin(radians(:lat)) * sin(radians(CAST(t.latitude AS double precision)))
    ))
  )
)`;

@Injectable()
export class SearchTenantsUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async run(query: SearchTenantsQueryDto): Promise<TenantSearchResponse> {
    const hasLat = query.lat !== undefined && query.lat !== null;
    const hasLng = query.lng !== undefined && query.lng !== null;

    if (hasLat !== hasLng) {
      throw new BusinessRuleException(
        'INVALID_COORDINATES',
        'Latitude e longitude devem ser informadas juntas.',
      );
    }

    const radius = query.radius ?? 10;
    if (radius > 50) {
      throw new BusinessRuleException(
        'RADIUS_TOO_LARGE',
        'O raio de busca não pode ser maior que 50 km.',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const hasCoordinates = hasLat && hasLng;
    const textQuery =
      query.q && query.q.trim().length >= 2 ? query.q.trim() : undefined;

    const dataQb = this.buildBaseQuery(
      hasCoordinates,
      textQuery,
      query,
      radius,
    );
    this.applySelects(dataQb, hasCoordinates, query.lat, query.lng);

    dataQb
      .groupBy('t.id')
      .addGroupBy('t.name')
      .addGroupBy('t.slug')
      .addGroupBy('t.segment')
      .addGroupBy('t.avatar_url')
      .addGroupBy('t.latitude')
      .addGroupBy('t.longitude')
      .addGroupBy('a.city')
      .addGroupBy('p.name')
      .addGroupBy('p.sort_weight')
      .addGroupBy('p.features')
      .orderBy('p.sort_weight', 'DESC')
      .addOrderBy('average_rating', 'DESC');

    if (hasCoordinates) {
      dataQb.addOrderBy('distance_km', 'ASC');
    }

    dataQb.limit(limit).offset(offset);

    const countQb = this.buildBaseQuery(
      hasCoordinates,
      textQuery,
      query,
      radius,
    );
    countQb.select('COUNT(DISTINCT t.id)', 'count');

    const [rows, countRow] = await Promise.all([
      dataQb.getRawMany<TenantSearchRawRow>(),
      countQb.getRawOne<{ count: string }>(),
    ]);

    const total = Number(countRow?.count ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: rows.map((row) => this.mapRow(row)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  private buildBaseQuery(
    hasCoordinates: boolean,
    textQuery: string | undefined,
    query: SearchTenantsQueryDto,
    radius: number,
  ): SelectQueryBuilder<TenantEntity> {
    const qb = this.dataSource
      .createQueryBuilder(TenantEntity, 't')
      .innerJoin(
        'tenant_subscriptions',
        'ts',
        'ts.tenant_id = t.id AND ts."deletedAt" IS NULL',
      )
      .innerJoin('plans', 'p', 'p.id = ts.plan_id AND p."deletedAt" IS NULL')
      .leftJoin(
        'addresses',
        'a',
        'a.id = t.address_id AND a."deletedAt" IS NULL',
      )
      .leftJoin(
        'reviews',
        'r',
        'r.target_id = t.id AND r.target_type = :targetType AND r."deletedAt" IS NULL',
        { targetType: ReviewTargetType.TENANT },
      )
      .where('t."deletedAt" IS NULL')
      .andWhere('ts.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD],
      });

    if (query.segment) {
      qb.andWhere('t.segment = :segment', { segment: query.segment });
    }

    if (textQuery) {
      qb.andWhere(
        '(LOWER(t.name) LIKE :textQuery OR LOWER(t.slug) LIKE :textQuery)',
        { textQuery: `%${textQuery.toLowerCase()}%` },
      );
    }

    if (hasCoordinates) {
      qb.andWhere('t.latitude IS NOT NULL AND t.longitude IS NOT NULL');
      qb.andWhere(`${HAVERSINE_SQL} <= :radius`, {
        lat: query.lat,
        lng: query.lng,
        radius,
      });
    }

    return qb;
  }

  private applySelects(
    qb: SelectQueryBuilder<TenantEntity>,
    hasCoordinates: boolean,
    lat?: number,
    lng?: number,
  ): void {
    qb.select('t.id', 'id')
      .addSelect('t.name', 'name')
      .addSelect('t.slug', 'slug')
      .addSelect('t.segment', 'segment')
      .addSelect('t.avatar_url', 'avatar_url')
      .addSelect('a.city', 'city')
      .addSelect('p.name', 'plan_name')
      .addSelect('p.features', 'plan_features')
      .addSelect('p.sort_weight', 'sort_weight')
      .addSelect('COALESCE(AVG(r.rating), 0)', 'average_rating')
      .addSelect('COUNT(r.id)', 'total_reviews');

    if (hasCoordinates) {
      qb.addSelect(HAVERSINE_SQL, 'distance_km').setParameters({
        lat,
        lng,
      });
    } else {
      qb.addSelect('NULL', 'distance_km');
    }
  }

  private mapRow(row: TenantSearchRawRow): TenantSearchResult {
    const features = row.plan_features ?? {
      eliteBadge: false,
      regionalHighlight: false,
    };

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      segment: row.segment as TenantSearchResult['segment'],
      avatarUrl: row.avatar_url,
      city: row.city,
      averageRating: Math.round(Number(row.average_rating) * 10) / 10,
      totalReviews: Number(row.total_reviews),
      distanceKm:
        row.distance_km !== null && row.distance_km !== undefined
          ? Number(row.distance_km)
          : null,
      plan: {
        name: row.plan_name,
        eliteBadge: Boolean(features.eliteBadge),
        regionalHighlight: Boolean(features.regionalHighlight),
      },
    };
  }
}
