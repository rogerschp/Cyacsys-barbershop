import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetTenantThemeUseCase } from 'src/modules/tenant-theme/use-cases/get-tenant-theme.use-case';
import { TENANT_REPOSITORY } from 'src/modules/tenant/interfaces/tenant-repository.interface';
import { TENANT_SUBSCRIPTION_REPOSITORY } from 'src/modules/subscription/interfaces/tenant-subscription-repository.interface';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { FonteDisponivel } from 'src/modules/tenant-theme/enums/fonte-disponivel.enum';
import { BorderRadiusOpcao } from 'src/modules/tenant-theme/enums/border-radius-opcao.enum';

describe('GetTenantThemeUseCase', () => {
  let useCase: GetTenantThemeUseCase;
  let tenantRepository: { findById: jest.Mock };
  let tenantSubscriptionRepository: { findByTenantIdWithPlan: jest.Mock };

  const tenantId = 'tenant-uuid';
  const mockTheme = {
    corPrimaria: '#111111',
    corSecundaria: '#222222',
    corFundo: '#FFFFFF',
    corTexto: '#000000',
    fonte: FonteDisponivel.INTER,
    borderRadius: BorderRadiusOpcao.MD,
    secoesLayout: [],
  };

  beforeEach(async () => {
    tenantRepository = { findById: jest.fn() };
    tenantSubscriptionRepository = { findByTenantIdWithPlan: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTenantThemeUseCase,
        { provide: TENANT_REPOSITORY, useValue: tenantRepository },
        {
          provide: TENANT_SUBSCRIPTION_REPOSITORY,
          useValue: tenantSubscriptionRepository,
        },
      ],
    }).compile();

    useCase = module.get(GetTenantThemeUseCase);
  });

  it('deve retornar theme e plan quando tenant e assinatura existem', async () => {
    tenantRepository.findById.mockResolvedValue({
      id: tenantId,
      theme: mockTheme,
    });
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue({
      plan: { name: PlanName.STANDARD },
    });

    const result = await useCase.run(tenantId);

    expect(result).toEqual({
      tenantId,
      theme: mockTheme,
      plan: PlanName.STANDARD,
    });
  });

  it('deve retornar theme null quando tenant não tem customização', async () => {
    tenantRepository.findById.mockResolvedValue({
      id: tenantId,
      theme: null,
    });
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue({
      plan: { name: PlanName.FREE },
    });

    const result = await useCase.run(tenantId);

    expect(result.theme).toBeNull();
    expect(result.plan).toBe(PlanName.FREE);
  });

  it('deve lançar NotFoundException quando tenant não existe', async () => {
    tenantRepository.findById.mockResolvedValue(null);

    await expect(useCase.run(tenantId)).rejects.toThrow(NotFoundException);
    expect(tenantSubscriptionRepository.findByTenantIdWithPlan).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundException quando assinatura não existe', async () => {
    tenantRepository.findById.mockResolvedValue({ id: tenantId, theme: null });
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(null);

    await expect(useCase.run(tenantId)).rejects.toThrow(NotFoundException);
  });
});
