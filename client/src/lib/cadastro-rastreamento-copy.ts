import type { OrdemCadastro } from "@/lib/cadastro-rastreamento.types";

export interface AuxilioCopiaItem {
  label: string;
  value: string;
}

/**
 * Itens exibidos na grelha "Auxílio de Cadastro" (e usados em cópia individual).
 * Edge case: se não há IMEI de entrada, não inclui linhas de chip de entrada
 * ainda que o ICCID exista no modelo.
 */
export function getAuxilioCopiaItens(ordem: OrdemCadastro): AuxilioCopiaItem[] {
  const itens: AuxilioCopiaItem[] = [
    { label: "Placa", value: ordem.placa },
    {
      label: "Nome",
      value: ordem.subcliente ?? ordem.cliente,
    },
  ];
  if (ordem.imei) {
    itens.push(
      { label: "IMEI (Entrada)", value: ordem.imei },
      {
        label: "ICCID (Entrada)",
        value: ordem.iccid ?? "",
      },
    );
  }
  if (ordem.imeiSaida) {
    itens.push(
      { label: "IMEI (Saída)", value: ordem.imeiSaida },
      {
        label: "ICCID (Saída)",
        value: ordem.iccidSaida ?? "",
      },
    );
  }
  return itens;
}

/**
 * Texto do botão "Copiar todos os dados principais" (Placa, Cliente, IMEIs/ICCIDs preenchidos).
 */
export function buildTextoCopiarTodosCadastroRast(ordem: OrdemCadastro): string {
  const linhas: string[] = [
    `Placa: ${ordem.placa}`,
    `Cliente: ${ordem.cliente}`,
  ];
  if (ordem.imei) linhas.push(`IMEI (Entrada): ${ordem.imei}`);
  if (ordem.iccid) linhas.push(`ICCID (Entrada): ${ordem.iccid}`);
  if (ordem.imeiSaida) linhas.push(`IMEI (Saída): ${ordem.imeiSaida}`);
  if (ordem.iccidSaida) linhas.push(`ICCID (Saída): ${ordem.iccidSaida}`);
  return linhas.join("\n");
}
