import type { OrdemCadastro } from "@/lib/cadastro-rastreamento.types";

/**
 * Na tabela, para instalação (CADASTRO) sem IMEI de saída explícito,
 * replica entrada na coluna de saída (mesma regra da UI anterior).
 */
export function getColunaEquipamentoSaida(ordem: OrdemCadastro): {
  imei: string | null;
  modelo: string | null;
} {
  const saidaIgualEntradaCadastro =
    ordem.tipoRegistro === "CADASTRO" && !ordem.imeiSaida?.trim();
  if (saidaIgualEntradaCadastro) {
    return { imei: ordem.imei, modelo: ordem.modeloAparelhoEntrada };
  }
  return { imei: ordem.imeiSaida, modelo: ordem.modeloSaida };
}
