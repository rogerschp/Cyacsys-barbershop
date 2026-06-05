import { Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../tenant/interfaces/tenant-repository.interface';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
} from '../../subscription/interfaces/tenant-subscription-repository.interface';
import { UpsertTenantThemeDto } from '../dto/upsert-tenant-theme.dto';
import { TipoSecao } from '../enums/tipo-secao.enum';
import { VarianteComponente } from '../enums/variante-componente.enum';
import {
  TenantThemeData,
} from '../interfaces/tenant-theme-data.interface';

@Injectable()
export class UpsertTenantThemeUseCase {
  private readonly logger = new Logger(UpsertTenantThemeUseCase.name);

  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async run(
    tenantId: string,
    dto: UpsertTenantThemeDto,
    performedBy: string,
  ): Promise<TenantThemeData> {
    await this.findTenantByIdUseCase.run(tenantId);

    const subscription =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!subscription) {
      throw new TenantForbiddenException(
        'SUBSCRIPTION_NOT_FOUND',
        'Assinatura não encontrada.',
        { tenantId },
      );
    }

    const features = subscription.plan.features;
    const plan = subscription.plan.name;

    if (!features.customization || features.customization === 'NONE') {
      throw new TenantForbiddenException(
        'PLAN_FEATURE_NOT_AVAILABLE',
        'Customização não disponível no plano atual.',
        { tenantId },
      );
    }

    this.validateSections(dto);

    if (features.customization === 'BASIC') {
      const hasInvalidVariant = dto.secoesLayout.some(
        (s) => s.variante !== VarianteComponente.PADRAO,
      );
      if (hasInvalidVariant) {
        throw new BusinessRuleException(
          'THEME_VARIANT_NOT_ALLOWED',
          'Variantes de componente não disponíveis no plano atual.',
        );
      }

      const hasInvalidOrder = dto.secoesLayout.some(
        (s, index) => s.ordem !== index,
      );
      if (hasInvalidOrder) {
        throw new BusinessRuleException(
          'THEME_REORDER_NOT_ALLOWED',
          'Reordenação de seções não disponível no plano atual.',
        );
      }
    }

    const theme: TenantThemeData = {
      corPrimaria: dto.corPrimaria,
      corSecundaria: dto.corSecundaria,
      corFundo: dto.corFundo,
      corTexto: dto.corTexto,
      fonte: dto.fonte,
      borderRadius: dto.borderRadius,
      secoesLayout: dto.secoesLayout.map((secao) => ({
        id: secao.id,
        tipo: secao.tipo,
        visivel: secao.visivel,
        ordem: secao.ordem,
        variante: secao.variante,
      })),
    };

    await this.tenantRepository.updateTheme(tenantId, theme);

    this.logger.log({
      event: 'tenant_theme_upserted',
      tenantId,
      plan,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return theme;
  }

  private validateSections(dto: UpsertTenantThemeDto): void {
    if (dto.secoesLayout.length !== 6) {
      throw new BusinessRuleException(
        'THEME_INVALID_SECTIONS_COUNT',
        'O layout deve conter exatamente 6 seções.',
      );
    }

    const validTipos = Object.values(TipoSecao);
    for (const secao of dto.secoesLayout) {
      if (!validTipos.includes(secao.tipo)) {
        throw new BusinessRuleException(
          'THEME_INVALID_SECTION_TYPE',
          `Tipo de seção inválido: ${secao.tipo}.`,
        );
      }
    }

    const tipos = dto.secoesLayout.map((s) => s.tipo);
    if (new Set(tipos).size !== tipos.length) {
      throw new BusinessRuleException(
        'THEME_DUPLICATE_SECTION_TYPE',
        'Tipos de seção duplicados não são permitidos.',
      );
    }

    const ordens = dto.secoesLayout.map((s) => s.ordem);
    if (new Set(ordens).size !== ordens.length) {
      throw new BusinessRuleException(
        'THEME_DUPLICATE_ORDER',
        'Ordens de seção duplicadas não são permitidas.',
      );
    }
  }
}
