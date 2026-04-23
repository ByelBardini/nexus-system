/**
 * Mapeamento de `OrdemServico.tipo` (API) para a UI de cadastro de rastreamento.
 * Tipo desconhecido → OUTRO (não se assume retirada).
 */
export type CadastroRastreamentoTipoRegistro =
  | "CADASTRO"
  | "REVISAO"
  | "RETIRADA"
  | "OUTRO";

const TIPO_OS_PARA_REGISTRO = {
  INSTALACAO_COM_BLOQUEIO: "CADASTRO",
  INSTALACAO_SEM_BLOQUEIO: "CADASTRO",
  REVISAO: "REVISAO",
  RETIRADA: "RETIRADA",
} as const satisfies Record<
  | "INSTALACAO_COM_BLOQUEIO"
  | "INSTALACAO_SEM_BLOQUEIO"
  | "REVISAO"
  | "RETIRADA",
  "CADASTRO" | "REVISAO" | "RETIRADA"
>;

export function mapTipoOsParaRegistro(
  tipo: string,
): CadastroRastreamentoTipoRegistro {
  if (tipo in TIPO_OS_PARA_REGISTRO) {
    return TIPO_OS_PARA_REGISTRO[tipo as keyof typeof TIPO_OS_PARA_REGISTRO];
  }
  return "OUTRO";
}

export function labelTipoServico(tipo: string): string {
  switch (tipo) {
    case "INSTALACAO_COM_BLOQUEIO":
      return "Instalação c/ bloqueio";
    case "INSTALACAO_SEM_BLOQUEIO":
      return "Instalação s/ bloqueio";
    case "REVISAO":
      return "Troca de Equipamento";
    case "RETIRADA":
      return "Retirada de Equipamento";
    default:
      return tipo.replaceAll("_", " ") || "Tipo de serviço";
  }
}

export type CadastroRastreamentoAcaoLabels = {
  iniciar: string;
  concluir: string;
  concluido: string;
  /** Mensagem de toast após mutação `iniciar` (não concatenar "do!" ao rótulo do botão). */
  toastIniciado: string;
};

/**
 * Rótulos de botão e toasts — uma entrada por `CadastroRastreamentoTipoRegistro`.
 */
export const cadastroRastreamentoAcaoLabels: Record<
  CadastroRastreamentoTipoRegistro,
  CadastroRastreamentoAcaoLabels
> = {
  CADASTRO: {
    iniciar: "Iniciar Cadastro",
    concluir: "Concluir Cadastro",
    concluido: "Cadastro Concluído",
    toastIniciado: "Cadastro iniciado!",
  },
  REVISAO: {
    iniciar: "Iniciar Revisão",
    concluir: "Concluir Revisão",
    concluido: "Revisão Concluída",
    toastIniciado: "Revisão iniciada!",
  },
  RETIRADA: {
    iniciar: "Iniciar Retirada",
    concluir: "Concluir Retirada",
    concluido: "Retirada Concluída",
    toastIniciado: "Retirada iniciada!",
  },
  OUTRO: {
    iniciar: "Iniciar registro",
    concluir: "Concluir registro",
    concluido: "Registro concluído",
    toastIniciado: "Registro iniciado!",
  },
};
