import { Test, TestingModule } from '@nestjs/testing';
import { Controller, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CrudController } from 'src/common/crud/crud.controller';
import { CrudService } from 'src/common/crud/crud.service';
import { ICrudRepository } from 'src/common/interfaces/crud-repository.interface';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

interface MockEntity {
  id: string;
  tenantId: string;
  name: string;
}

@Controller('test-crud')
class TestCrudController extends CrudController<
  MockEntity,
  CrudService<MockEntity, ICrudRepository<MockEntity, any, any>, any, any>,
  ICrudRepository<MockEntity, any, any>,
  any,
  any
> {
  constructor(
    service: CrudService<
      MockEntity,
      ICrudRepository<MockEntity, any, any>,
      any,
      any
    >,
  ) {
    super(service);
  }
}

describe('CrudController (HTTP)', () => {
  let app: INestApplication;
  let crudService: jest.Mocked<
    CrudService<MockEntity, ICrudRepository<MockEntity, any, any>, any, any>
  >;

  const mockEntity: MockEntity = {
    id: 'entity-1',
    tenantId: 'tenant-1',
    name: 'Test Entity',
  };

  const mockPaginatedResponse: PaginatedResponseDto<MockEntity> = {
    data: [mockEntity],
    total: 1,
    first: 0,
    rows: 10,
    page: 1,
    pageCount: 1,
  };

  beforeAll(async () => {
    const mockService = {
      findPaginated: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestCrudController],
      providers: [
        {
          provide: CrudService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use((req: any, _res, next) => {
      req.tenant = { id: 'tenant-1' };
      req.tenantId = 'tenant-1';
      next();
    });

    await app.init();

    crudService = moduleFixture.get(CrudService) as any;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(crudService).toBeDefined();
  });

  describe('GET /test-crud (findPaginated)', () => {
    it('deve retornar 200 e resposta paginada', () => {
      crudService.findPaginated.mockResolvedValue(mockPaginatedResponse);

      return request(app.getHttpServer())
        .get('/test-crud')
        .query({ first: 0, rows: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total', 1);
          expect(res.body.data).toHaveLength(1);
          expect(crudService.findPaginated).toHaveBeenCalled();
        });
    });
  });

  describe('GET /test-crud/:id (findOne)', () => {
    it('deve retornar 200 e a entidade', () => {
      crudService.findOne.mockResolvedValue(mockEntity);

      return request(app.getHttpServer())
        .get('/test-crud/entity-1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'entity-1');
          expect(res.body).toHaveProperty('name', 'Test Entity');
          expect(crudService.findOne).toHaveBeenCalledWith(
            'entity-1',
            'tenant-1',
          );
        });
    });
  });

  describe('POST /test-crud (create)', () => {
    it('deve retornar 201 e a entidade criada', () => {
      crudService.create.mockResolvedValue(mockEntity);

      return request(app.getHttpServer())
        .post('/test-crud')
        .send({ name: 'Test Entity' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Test Entity');
          expect(crudService.create).toHaveBeenCalledWith(
            { name: 'Test Entity' },
            'tenant-1',
          );
        });
    });
  });

  describe('PATCH /test-crud/:id (update)', () => {
    it('deve retornar 200 e a entidade atualizada', () => {
      const updated = { ...mockEntity, name: 'Updated' };
      crudService.update.mockResolvedValue(updated);

      return request(app.getHttpServer())
        .patch('/test-crud/entity-1')
        .send({ name: 'Updated' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Updated');
          expect(crudService.update).toHaveBeenCalledWith(
            'entity-1',
            { name: 'Updated' },
            'tenant-1',
          );
        });
    });
  });

  describe('DELETE /test-crud/:id (delete)', () => {
    it('deve retornar 200 e a entidade removida', async () => {
      crudService.delete.mockResolvedValue(mockEntity);

      await request(app.getHttpServer())
        .delete('/test-crud/entity-1')
        .expect(200);

      expect(crudService.delete).toHaveBeenCalledWith('entity-1', 'tenant-1');
    });
  });
});
