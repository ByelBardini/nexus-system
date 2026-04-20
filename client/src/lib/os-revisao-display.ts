/**
 * Regras de exibição para OS de REVISÃO (emissão imutável vs dados de teste em *Entrada).
 * Centralizado para testes e para evitar divergência entre telas.
 */

export function getOsDadosTesteParaExibicao(os: {
  idAparelho?: string | null;
  idEntrada?: string | null;
  localInstalacao?: string | null;
  localInstalacaoEntrada?: string | null;
  posChave?: string | null;
  posChaveEntrada?: string | null;
}) {
  return {
    imeiEntrada: os.idEntrada || os.idAparelho || null,
    localInstalacao: os.localInstalacaoEntrada || os.localInstalacao || null,
    posChave: os.posChaveEntrada || os.posChave || null,
  };
}

export function getCadastroMapDeviceFields(
  tipoOs: string,
  os: {
    idAparelho: string | null;
    idEntrada: string | null;
    iccidAparelho: string | null;
    iccidEntrada: string | null;
    localInstalacao: string | null;
    localInstalacaoEntrada: string | null;
    posChave: string | null;
    posChaveEntrada: string | null;
  },
) {
  const isRevisao = tipoOs === "REVISAO";
  const isRetirada = tipoOs === "RETIRADA";
  if (isRevisao) {
    return {
      isRevisao: true as const,
      imeiEntrada: os.idEntrada,
      imeiSaida: os.idAparelho,
      iccidEntradaOs: os.iccidEntrada,
      iccidSaidaOs: os.iccidAparelho,
      local: os.localInstalacaoEntrada ?? os.localInstalacao,
      posChave: os.posChaveEntrada ?? os.posChave,
    };
  }
  if (isRetirada) {
    // Em RETIRADA não há aparelho entrando no veículo: o ID informado na
    // emissão (idAparelho) representa o aparelho que sai — vai para estoque.
    return {
      isRevisao: false as const,
      imeiEntrada: null,
      imeiSaida: os.idAparelho,
      iccidEntradaOs: null,
      iccidSaidaOs: os.iccidAparelho,
      local: os.localInstalacao,
      posChave: os.posChave,
    };
  }
  return {
    isRevisao: false as const,
    imeiEntrada: os.idAparelho,
    imeiSaida: os.idEntrada,
    iccidEntradaOs: os.iccidAparelho,
    iccidSaidaOs: os.iccidEntrada,
    local: os.localInstalacao,
    posChave: os.posChave,
  };
}
