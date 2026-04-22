import type { PrecoTecnico, Tecnico } from "./ordens-servico-criacao.types";
import { tipoToPrecoKey } from "./ordens-servico-criacao.constants";

function parsePreco(
  valor: number | string | null | undefined,
): { num: number; temValor: boolean } {
  const n = typeof valor === "string" ? parseFloat(valor) : Number(valor ?? 0);
  if (Number.isNaN(n) || n <= 0) return { num: 0, temValor: false };
  return { num: n, temValor: true };
}

export function precoTecnicoCardDisplay(
  valor: number | string | null | undefined,
): { texto: string; temValor: boolean } {
  const { num, temValor } = parsePreco(valor);
  if (!temValor) return { texto: "—", temValor: false };
  return {
    texto: num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    temValor: true,
  };
}

export function computeDeslocamentoSidebar(params: {
  kmEstimado: number | "";
  precoDeslocamentoRaw: number | string | null | undefined;
}): {
  precoKm: number;
  temPrecoKm: boolean;
  totalDeslocamento: number | null;
} {
  const { num: precoKm, temValor: temPrecoKm } = parsePreco(
    params.precoDeslocamentoRaw,
  );
  const { kmEstimado } = params;
  const totalDeslocamento =
    temPrecoKm && kmEstimado !== "" && kmEstimado > 0
      ? precoKm * kmEstimado
      : null;
  return { precoKm, temPrecoKm, totalDeslocamento };
}

export function computeValorTotalAproximado(params: {
  tipo: string;
  kmEstimado: number | "";
  tecnico: Tecnico | undefined;
}): {
  precoServico: number | null;
  totalDeslocamento: number | null;
  valorTotal: number | null;
} {
  const { tipo, kmEstimado, tecnico } = params;
  const key = tipo && tipoToPrecoKey[tipo];
  const rawServico = key
    ? tecnico?.precos?.[key as keyof PrecoTecnico]
    : null;
  const { num: numServico, temValor: temServico } = parsePreco(rawServico);
  const precoServico = temServico ? numServico : null;

  const { totalDeslocamento } = computeDeslocamentoSidebar({
    kmEstimado,
    precoDeslocamentoRaw: tecnico?.precos?.deslocamento,
  });

  const valorTotal =
    precoServico !== null
      ? precoServico + (totalDeslocamento ?? 0)
      : null;

  return { precoServico, totalDeslocamento, valorTotal };
}

export function formatBrl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
