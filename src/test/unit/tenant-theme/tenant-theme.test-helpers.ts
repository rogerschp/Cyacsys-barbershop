import { BorderRadiusOpcao } from 'src/modules/tenant-theme/enums/border-radius-opcao.enum';
import { FonteDisponivel } from 'src/modules/tenant-theme/enums/fonte-disponivel.enum';
import { TipoSecao } from 'src/modules/tenant-theme/enums/tipo-secao.enum';
import { VarianteComponente } from 'src/modules/tenant-theme/enums/variante-componente.enum';
import { UpsertTenantThemeDto } from 'src/modules/tenant-theme/dto/upsert-tenant-theme.dto';

const SECTION_TYPES = [
  TipoSecao.PROFISSIONAIS,
  TipoSecao.HORARIOS,
  TipoSecao.SERVICOS,
  TipoSecao.AVALIACOES,
  TipoSecao.SOBRE,
  TipoSecao.ENDERECO,
];

export function buildValidThemeDto(
  overrides: Partial<UpsertTenantThemeDto> = {},
): UpsertTenantThemeDto {
  const secoesLayout = SECTION_TYPES.map((tipo, ordem) => ({
    id: `sec-${tipo}`,
    tipo,
    visivel: true,
    ordem,
    variante: VarianteComponente.PADRAO,
  }));

  return {
    corPrimaria: '#111111',
    corSecundaria: '#222222',
    corFundo: '#FFFFFF',
    corTexto: '#000000',
    fonte: FonteDisponivel.INTER,
    borderRadius: BorderRadiusOpcao.MD,
    secoesLayout,
    ...overrides,
  };
}
