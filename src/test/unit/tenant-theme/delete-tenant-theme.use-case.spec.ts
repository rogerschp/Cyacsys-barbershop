import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteTenantThemeUseCase } from 'src/modules/tenant-theme/use-cases/delete-tenant-theme.use-case';
import { TENANT_REPOSITORY } from 'src/modules/tenant/interfaces/tenant-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';

describe('DeleteTenantThemeUseCase', () => {
  let useCase: DeleteTenantThemeUseCase;
  let tenantRepository: { updateTheme: jest.Mock };
  let findTenantByIdUseCase: { run: jest.Mock };

  const tenantId = 'tenant-uuid';
  const performedBy = 'user-uuid';

  beforeEach(async () => {
    tenantRepository = { updateTheme: jest.fn().mockResolvedValue(undefined) };
    findTenantByIdUseCase = {
      run: jest.fn().mockResolvedValue({ id: tenantId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTenantThemeUseCase,
        { provide: TENANT_REPOSITORY, useValue: tenantRepository },
        { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
      ],
    }).compile();

    useCase = module.get(DeleteTenantThemeUseCase);
  });

  it('deve definir theme como null', async () => {
    await useCase.run(tenantId, performedBy);

    expect(findTenantByIdUseCase.run).toHaveBeenCalledWith(tenantId);
    expect(tenantRepository.updateTheme).toHaveBeenCalledWith(tenantId, null);
  });

  it('deve lançar NotFoundException quando tenant não existe', async () => {
    findTenantByIdUseCase.run.mockRejectedValue(
      new NotFoundException('Tenant not found!'),
    );

    await expect(useCase.run(tenantId, performedBy)).rejects.toThrow(
      NotFoundException,
    );
    expect(tenantRepository.updateTheme).not.toHaveBeenCalled();
  });
});
