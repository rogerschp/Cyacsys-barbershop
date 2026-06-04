import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { PlanController } from 'src/modules/subscription/controllers/plan.controller';
import { GetPlansUseCase } from 'src/modules/subscription/use-cases/get-plans.use-case';
import { BillingCycle } from 'src/modules/subscription/enums/billing-cycle.enum';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';

describe('PlanController (HTTP)', () => {
  let app: INestApplication;
  const getPlansUseCase = { run: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [{ provide: GetPlansUseCase, useValue: getPlansUseCase }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /plans lista planos ativos', async () => {
    getPlansUseCase.run.mockResolvedValue([
      {
        id: 'plan-1',
        name: PlanName.FREE,
        billingCycle: BillingCycle.NONE,
        price: '0.00',
        sortWeight: 0,
        gracePeriodDays: 0,
        features: { reviews: false },
        isActive: true,
      },
    ]);

    await request(app.getHttpServer())
      .get('/plans')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].name).toBe(PlanName.FREE);
        expect(getPlansUseCase.run).toHaveBeenCalled();
      });
  });
});
