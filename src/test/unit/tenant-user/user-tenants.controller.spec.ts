import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserTenantsController } from 'src/modules/tenant-user/user-tenants.controller';
import { ListMyTenantsUseCase } from 'src/modules/tenant-user/use-cases/list-my-tenants.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';

describe('UserTenantsController (HTTP)', () => {
  let app: INestApplication;
  let listMyTenantsUseCase: { run: jest.Mock };

  beforeAll(async () => {
    listMyTenantsUseCase = {
      run: jest.fn().mockResolvedValue([{ tenantId: 't1', role: 'OWNER' }]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserTenantsController],
      providers: [
        { provide: ListMyTenantsUseCase, useValue: listMyTenantsUseCase },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-1' } };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users/me/tenants', () => {
    return request(app.getHttpServer())
      .get('/users/me/tenants')
      .expect(200)
      .expect(() => {
        expect(listMyTenantsUseCase.run).toHaveBeenCalledWith('user-1');
      });
  });
});

describe('UserTenantsController (HTTP) — user ausente', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserTenantsController],
      providers: [
        { provide: ListMyTenantsUseCase, useValue: { run: jest.fn() } },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {};
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna 404 quando user não identificado', () => {
    return request(app.getHttpServer()).get('/users/me/tenants').expect(404);
  });
});
