import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';
import { SearchTenantsUseCase } from 'src/modules/search/use-cases/search-tenants.use-case';

describe('SearchTenantsUseCase', () => {
  let useCase: SearchTenantsUseCase;

  const dataQb = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const countQb = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
  };

  const dataSource = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    let qbCall = 0;
    dataSource.createQueryBuilder = jest.fn().mockImplementation(() => {
      qbCall += 1;
      return qbCall % 2 === 1 ? dataQb : countQb;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchTenantsUseCase,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    useCase = module.get(SearchTenantsUseCase);
  });

  it('rejeita latitude sem longitude', async () => {
    await expect(useCase.run({ lat: -23.55 })).rejects.toBeInstanceOf(
      BusinessRuleException,
    );

    try {
      await useCase.run({ lat: -23.55 });
    } catch (error) {
      expect((error as BusinessRuleException).getResponse()).toMatchObject({
        code: 'INVALID_COORDINATES',
      });
    }
  });

  it('rejeita longitude sem latitude', async () => {
    try {
      await useCase.run({ lng: -46.63 });
    } catch (error) {
      expect((error as BusinessRuleException).getResponse()).toMatchObject({
        code: 'INVALID_COORDINATES',
      });
    }
  });

  it('rejeita raio maior que 50 km', async () => {
    try {
      await useCase.run({ lat: -23.55, lng: -46.63, radius: 51 });
    } catch (error) {
      expect((error as BusinessRuleException).getResponse()).toMatchObject({
        code: 'RADIUS_TOO_LARGE',
      });
    }
  });

  it('ignora q com menos de 2 caracteres', async () => {
    await useCase.run({ q: 'a' });

    expect(dataQb.andWhere).not.toHaveBeenCalledWith(
      expect.stringContaining('LOWER(t.name)'),
      expect.anything(),
    );
  });

  it('aplica filtro de texto, segmento e coordenadas na query', async () => {
    await useCase.run({
      q: 'barbearia',
      segment: TenantSegment.BARBERSHOP,
      lat: -23.55,
      lng: -46.63,
      radius: 25,
      page: 2,
      limit: 10,
    });

    expect(dataQb.andWhere).toHaveBeenCalledWith('t.segment = :segment', {
      segment: TenantSegment.BARBERSHOP,
    });
    expect(dataQb.andWhere).toHaveBeenCalledWith(
      '(LOWER(t.name) LIKE :textQuery OR LOWER(t.slug) LIKE :textQuery)',
      { textQuery: '%barbearia%' },
    );
    expect(dataQb.andWhere).toHaveBeenCalledWith(
      't.latitude IS NOT NULL AND t.longitude IS NOT NULL',
    );
    expect(dataQb.addSelect).toHaveBeenCalledWith(
      expect.stringContaining('6371 * acos'),
      'distance_km',
    );
    expect(dataQb.setParameters).toHaveBeenCalledWith({
      lat: -23.55,
      lng: -46.63,
    });
    expect(dataQb.addOrderBy).toHaveBeenCalledWith('distance_km', 'ASC');
    expect(dataQb.limit).toHaveBeenCalledWith(10);
    expect(dataQb.offset).toHaveBeenCalledWith(10);
  });

  it('retorna resposta paginada com defaults', async () => {
    dataQb.getRawMany.mockResolvedValue([
      {
        id: 'tenant-1',
        name: 'Barbearia',
        slug: 'barbearia',
        segment: TenantSegment.BARBERSHOP,
        avatar_url: 'https://cdn.example.com/a.png',
        city: 'São Paulo',
        plan_name: 'PRO',
        plan_features: { eliteBadge: true, regionalHighlight: true },
        sort_weight: '2',
        average_rating: '4.567',
        total_reviews: '3',
        distance_km: null,
      },
    ]);
    countQb.getRawOne.mockResolvedValue({ count: '1' });

    const result = await useCase.run({ q: 'barbearia' });

    expect(result).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      data: [
        {
          id: 'tenant-1',
          name: 'Barbearia',
          slug: 'barbearia',
          segment: TenantSegment.BARBERSHOP,
          avatarUrl: 'https://cdn.example.com/a.png',
          city: 'São Paulo',
          averageRating: 4.6,
          totalReviews: 3,
          distanceKm: null,
          plan: {
            name: 'PRO',
            eliteBadge: true,
            regionalHighlight: true,
          },
        },
      ],
    });
  });

  it('retorna total zero quando count não vem do banco', async () => {
    countQb.getRawOne.mockResolvedValue(null);

    const result = await useCase.run({});

    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('mapeia distância e usa defaults de plano quando features ausentes', async () => {
    dataQb.getRawMany.mockResolvedValue([
      {
        id: 'tenant-2',
        name: 'Studio',
        slug: 'studio',
        segment: null,
        avatar_url: null,
        city: null,
        plan_name: 'FREE',
        plan_features: null,
        sort_weight: '0',
        average_rating: '0',
        total_reviews: '0',
        distance_km: '3.45',
      },
    ]);
    countQb.getRawOne.mockResolvedValue({ count: '0' });

    const result = await useCase.run({
      lat: -23.55,
      lng: -46.63,
    });

    expect(result.totalPages).toBe(0);
    expect(result.data[0]).toMatchObject({
      distanceKm: 3.45,
      plan: {
        name: 'FREE',
        eliteBadge: false,
        regionalHighlight: false,
      },
    });
  });
});
