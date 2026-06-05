import { BorderRadiusOpcao } from '../enums/border-radius-opcao.enum';
import { FonteDisponivel } from '../enums/fonte-disponivel.enum';
import { TipoSecao } from '../enums/tipo-secao.enum';
import { VarianteComponente } from '../enums/variante-componente.enum';

export interface SecaoLayout {
  id: string;
  tipo: TipoSecao;
  visivel: boolean;
  ordem: number;
  variante: VarianteComponente;
}

export interface TenantThemeData {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corTexto: string;
  fonte: FonteDisponivel;
  borderRadius: BorderRadiusOpcao;
  secoesLayout: SecaoLayout[];
}
