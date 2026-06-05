import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpsertTenantThemeUseCase } from 'src/modules/tenant-theme/use-cases/upsert-tenant-theme.use-case';
import { TENANT_REPOSITORY } from 'src/modules/tenant/interfaces/tenant-repository.interface';
import { TENANT_SUBSCRIPTION_REPOSITORY } from 'src/modules/subscription/interfaces/tenant-subscription-repository.interface';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';
import { TenantForbiddenException } from 'src/common/exceptions/tenant-forbidden.exception';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { VarianteComponente } from 'src/modules/tenant-theme/enums/variante-componente.enum';
import { TipoSecao } from 'src/modules/tenant-theme/enums/tipo-secao.enum';
import { buildValidThemeDto } from './tenant-theme.test-helpers';

describe('UpsertTenantThemeUseCase', () => {
  let useCase: UpsertTenantThemeUseCase;
  let tenantRepository: { updateTheme: jest.Mock };
  let findTenantByIdUseCase: { run: jest.Mock };
  let tenantSubscriptionRepository: { findByTenantIdWithPlan: jest.Mock };

  const tenantId = 'tenant-uuid';
  const performedBy = 'user-uuid';

  beforeEach(async () => {
    tenantRepository = { updateTheme: jest.fn().mockResolvedValue(undefined) };
    findTenantByIdUseCase = { run: jest.fn().mockResolvedValue({ id: tenantId }) };
    tenantSubscriptionRepository = { findByTenantIdWithPlan: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpsertTenantThemeUseCase,
        { provide: TENANT_REPOSITORY, useValue: tenantRepository },
        { provide: FindTenantByIdUseCase, useValue: findTenantByIdUseCase },
        {
          provide: TENANT_SUBSCRIPTION_REPOSITORY,
          useValue: tenantSubscriptionRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpsertTenantThemeUseCase);
  });

  const mockSubscription = (customization: string, plan = PlanName.STANDARD) => ({
    plan: {
      name: plan,
      features: { customization },
    },
  });

  it('deve salvar tema no plano PRO sem restrições de variante ou ordem', async () => {
    const dto = buildValidThemeDto({
      secoesLayout: buildValidThemeDto().secoesLayout.map((secao, index) => ({
        ...secao,
        ordem: 5 - index,
        variante: VarianteComponente.ALTERNATIVO,
      })),
    });

    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('INTERMEDIATE', PlanName.PRO),
    );

    const result = await useCase.run(tenantId, dto, performedBy);

    expect(tenantRepository.updateTheme).toHaveBeenCalledWith(tenantId, result);
    expect(result.corPrimaria).toBe('#111111');
  });

  it('deve salvar tema no plano BASIC com variante padrao e ordem fixa', async () => {
    const dto = buildValidThemeDto();
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('BASIC'),
    );

    await useCase.run(tenantId, dto, performedBy);

    expect(tenantRepository.updateTheme).toHaveBeenCalled();
  });

  it('deve lançar NotFoundException quando tenant não existe', async () => {
    findTenantByIdUseCase.run.mockRejectedValue(
      new NotFoundException('Tenant not found!'),
    );

    await expect(
      useCase.run(tenantId, buildValidThemeDto(), performedBy),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar TenantForbiddenException quando assinatura não existe', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(null);

    await expect(
      useCase.run(tenantId, buildValidThemeDto(), performedBy),
    ).rejects.toThrow(TenantForbiddenException);
  });

  it('deve lançar TenantForbiddenException no plano FREE', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('NONE', PlanName.FREE),
    );

    await expect(
      useCase.run(tenantId, buildValidThemeDto(), performedBy),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PLAN_FEATURE_NOT_AVAILABLE' }),
    });
    expect(tenantRepository.updateTheme).not.toHaveBeenCalled();
  });

  it('deve lançar BusinessRuleException quando variante não é padrao no BASIC', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('BASIC'),
    );

    const dto = buildValidThemeDto({
      secoesLayout: buildValidThemeDto().secoesLayout.map((secao) => ({
        ...secao,
        variante: VarianteComponente.COMPACTO,
      })),
    });

    await expect(useCase.run(tenantId, dto, performedBy)).rejects.toThrow(
      BusinessRuleException,
    );
  });

  it('deve lançar BusinessRuleException quando ordem não é fixa no BASIC', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('BASIC'),
    );

    const dto = buildValidThemeDto({
      secoesLayout: buildValidThemeDto().secoesLayout.map((secao, index) => {
        if (index === 0) return { ...secao, ordem: 1 };
        if (index === 1) return { ...secao, ordem: 0 };
        return secao;
      }),
    });

    await expect(useCase.run(tenantId, dto, performedBy)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'THEME_REORDER_NOT_ALLOWED' }),
    });
  });

  it('deve lançar BusinessRuleException quando há tipos de seção duplicados', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('INTERMEDIATE', PlanName.PRO),
    );

    const base = buildValidThemeDto().secoesLayout;
    const dto = buildValidThemeDto({
      secoesLayout: base.map((secao, index) =>
        index === 1 ? { ...secao, tipo: TipoSecao.PROFISSIONAIS } : secao,
      ),
    });

    await expect(useCase.run(tenantId, dto, performedBy)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'THEME_DUPLICATE_SECTION_TYPE' }),
    });
  });

  it('deve lançar BusinessRuleException quando há ordens duplicadas', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('FULL', PlanName.ELITE),
    );

    const dto = buildValidThemeDto({
      secoesLayout: buildValidThemeDto().secoesLayout.map((secao, index) => ({
        ...secao,
        ordem: index === 1 ? 0 : secao.ordem,
      })),
    });

    await expect(useCase.run(tenantId, dto, performedBy)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'THEME_DUPLICATE_ORDER' }),
    });
  });

  it('deve lançar BusinessRuleException quando quantidade de seções é inválida', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('INTERMEDIATE', PlanName.PRO),
    );

    const dto = buildValidThemeDto({
      secoesLayout: buildValidThemeDto().secoesLayout.slice(0, 5),
    });

    await expect(useCase.run(tenantId, dto, performedBy)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'THEME_INVALID_SECTIONS_COUNT' }),
    });
  });

  it('deve lançar BusinessRuleException quando tipo de seção é inválido', async () => {
    tenantSubscriptionRepository.findByTenantIdWithPlan.mockResolvedValue(
      mockSubscription('INTERMEDIATE', PlanName.PRO),
    );

    const dto = buildValidThemeDto({
      secoesLayout: buildValidThemeDto().secoesLayout.map((secao, index) =>
        index === 0 ? { ...secao, tipo: 'invalido' as TipoSecao } : secao,
      ),
    });

    await expect(useCase.run(tenantId, dto, performedBy)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'THEME_INVALID_SECTION_TYPE' }),
    });
  });
});
