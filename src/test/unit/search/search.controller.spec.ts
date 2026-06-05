import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from 'src/modules/search/controllers/search.controller';
import { SearchTenantsUseCase } from 'src/modules/search/use-cases/search-tenants.use-case';

describe('SearchController', () => {
  let controller: SearchController;
  const searchTenantsUseCase = { run: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        { provide: SearchTenantsUseCase, useValue: searchTenantsUseCase },
      ],
    }).compile();

    controller = module.get(SearchController);
    searchTenantsUseCase.run.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });

  it('delega busca de tenants ao use case', async () => {
    const query = { q: 'barbearia', page: 1, limit: 20 };
    await controller.searchTenants(query);

    expect(searchTenantsUseCase.run).toHaveBeenCalledWith(query);
  });
});
