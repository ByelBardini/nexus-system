import type {
  DebitoRastreadorApi,
  ProprietarioDebitoFilter,
} from "@/types/aparelhos-debito-rastreador";

export type { DebitoRastreadorApi, ProprietarioDebitoFilter } from "@/types/aparelhos-debito-rastreador";

export function formatDebitoLabel(d: DebitoRastreadorApi): string {
  const devedor = d.devedorCliente?.nome ?? "Infinity";
  const credor = d.credorCliente?.nome ?? "Infinity";
  return `${devedor} deve ${d.quantidade}x ${d.marca.nome} ${d.modelo.nome} → ${credor}`;
}

/**
 * Filtra débitos abertos pelo devedor e, opcionalmente, por par marca/modelo.
 * Comportamento alinhado às telas de cadastro (individual e lote).
 */
export function filterDebitosRastreadores(
  todos: DebitoRastreadorApi[],
  opts: {
    proprietario: ProprietarioDebitoFilter;
    clienteId: number | null;
    marcaModelo: { marcaId: number; modeloId: number } | null;
  },
): DebitoRastreadorApi[] {
  return todos.filter((d) => {
    const isDevedor =
      opts.proprietario === "INFINITY"
        ? d.devedorTipo === "INFINITY"
        : opts.clienteId
          ? d.devedorTipo === "CLIENTE" &&
            d.devedorClienteId === opts.clienteId
          : false;
    if (!isDevedor) return false;
    if (opts.marcaModelo) {
      return (
        d.marcaId === opts.marcaModelo.marcaId &&
        d.modeloId === opts.marcaModelo.modeloId
      );
    }
    return true;
  });
}
