import type { CadastroRastreamentoTipoRegistro } from "@/lib/cadastro-rastreamento-tipo-mappers";
import type { OrdemCadastro, Plataforma, StatusCadastro } from "@/lib/cadastro-rastreamento.types";

export const CADASTRO_RAST_STATUS_CONFIG: Record<
  StatusCadastro,
  { label: string; className: string }
> = {
  AGUARDANDO: {
    label: "Aguardando",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  EM_CADASTRO: {
    label: "Em Cadastro",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  CONCLUIDO: {
    label: "Concluído",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

export const CADASTRO_RAST_TIPO_REGISTRO_CONFIG: Record<
  CadastroRastreamentoTipoRegistro,
  { label: string; className: string }
> = {
  CADASTRO: {
    label: "Cadastro",
    className: "bg-sky-50 text-sky-800 border-sky-200",
  },
  REVISAO: {
    label: "Revisão",
    className: "bg-purple-50 text-purple-800 border-purple-200",
  },
  RETIRADA: {
    label: "Retirada",
    className: "bg-orange-50 text-orange-800 border-orange-200",
  },
  OUTRO: {
    label: "Outro tipo",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
};

const LABEL_INSTALACAO_COM_BLOQUEIO = "INSTALAÇÃO C/ BLOQUEIO";
const LABEL_INSTALACAO_SEM_BLOQUEIO = "INSTALAÇÃO S/ BLOQUEIO";

export function badgeServicoColunaCadastroRast(ordem: OrdemCadastro): {
  label: string;
  className: string;
} {
  if (
    ordem.tipoRegistro === "CADASTRO" &&
    ordem.instalacaoComBloqueio !== null
  ) {
    return {
      label: ordem.instalacaoComBloqueio
        ? LABEL_INSTALACAO_COM_BLOQUEIO
        : LABEL_INSTALACAO_SEM_BLOQUEIO,
      className: CADASTRO_RAST_TIPO_REGISTRO_CONFIG.CADASTRO.className,
    };
  }
  return CADASTRO_RAST_TIPO_REGISTRO_CONFIG[ordem.tipoRegistro];
}

export const PLATAFORMA_RAST_LABEL: Record<Plataforma, string> = {
  GETRAK: "Getrak",
  GEOMAPS: "Geomaps",
  SELSYN: "Selsyn",
};

/** Radix Select não permite SelectItem com value=""; reservado para placeholder. */
export const SELECT_CADASTRO_RAST_TODOS = "__todos__";

export const CADASTRO_RAST_STATUS_TABS = [
  { value: "TODOS" as const, label: "Todos" },
  { value: "AGUARDANDO" as const, label: "Aguardando" },
  { value: "EM_CADASTRO" as const, label: "Em Cadastro" },
  { value: "CONCLUIDO" as const, label: "Concluído" },
] as const;
