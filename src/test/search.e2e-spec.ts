import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { BusinessRuleException } from '../common/exceptions/business-rule.exception';
import { TenantSegment } from '../common/enums/tenant-segment.enum';
import { SearchController } from '../modules/search/controllers/search.controller';
import { SearchTenantsUseCase } from '../modules/search/use-cases/search-tenants.use-case';

describe('SearchController (e2e)', () => {
  let app: INestApplication;
  let searchTenantsUseCase: jest.Mocked<SearchTenantsUseCase>;

  const searchResponse = {
    data: [
      {
        id: 'tenant-e2e-uuid',
        name: 'Barbearia E2E',
        slug: 'barbearia-e2e',
        segment: TenantSegment.BARBERSHOP,
        avatarUrl: null,
        city: 'São Paulo',
        averageRating: 4.5,
        totalReviews: 2,
        distanceKm: 1.2,
        plan: {
          name: 'PRO',
          eliteBadge: false,
          regionalHighlight: true,
        },
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeAll(async () => {
    const mockUseCase = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: SearchTenantsUseCase, useValue: mockUseCase },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    searchTenantsUseCase = moduleFixture.get(
      SearchTenantsUseCase,
    ) as jest.Mocked<SearchTenantsUseCase>;
    searchTenantsUseCase.run.mockResolvedValue(searchResponse);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /search/tenants', () => {
    it('retorna 200 com resultados paginados sem autenticação', async () => {
      const res = await request(app.getHttpServer())
        .get('/search/tenants')
        .query({ q: 'barbearia', page: 1, limit: 20 })
        .expect(200);

      expect(searchTenantsUseCase.run).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'barbearia', page: 1, limit: 20 }),
      );
      expect(res.body).toEqual(searchResponse);
    });

    it('aceita filtros de região e segmento', async () => {
      await request(app.getHttpServer())
        .get('/search/tenants')
        .query({
          lat: -23.55,
          lng: -46.63,
          radius: 15,
          segment: TenantSegment.BARBERSHOP,
        })
        .expect(200);

      expect(searchTenantsUseCase.run).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: -23.55,
          lng: -46.63,
          radius: 15,
          segment: TenantSegment.BARBERSHOP,
        }),
      );
    });

    it('propaga erro de regra de negócio do use case', async () => {
      searchTenantsUseCase.run.mockRejectedValueOnce(
        new BusinessRuleException(
          'INVALID_COORDINATES',
          'Latitude e longitude devem ser informadas juntas.',
        ),
      );

      const res = await request(app.getHttpServer())
        .get('/search/tenants')
        .query({ lat: -23.55 })
        .expect(400);

      expect(res.body).toMatchObject({
        code: 'INVALID_COORDINATES',
        error: 'BUSINESS_RULE_VIOLATION',
      });
    });

    it('retorna 400 quando radius excede o máximo permitido', async () => {
      const res = await request(app.getHttpServer())
        .get('/search/tenants')
        .query({ radius: 51 })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('radius'),
        ]),
      );
    });
  });
});
