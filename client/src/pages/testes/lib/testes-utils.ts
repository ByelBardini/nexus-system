import type { OsTeste } from "./testes-types";

/**
 * IMEI/serial exibido e usado para vínculo na bancada de testes.
 * REVISÃO: aparelho novo em teste vem em idEntrada; demais tipos usam idAparelho.
 */
export function imeiVinculadoNaBancadaTestes(os: OsTeste | null): string {
  if (!os) return "";
  if (os.tipo === "REVISAO") return (os.idEntrada ?? "").trim();
  return (os.idAparelho ?? "").trim();
}

export function subclienteLabel(os: {
  subcliente?: { id?: number; nome: string } | null;
  subclienteSnapshotNome?: string | null;
}): string {
  return os.subcliente?.nome ?? os.subclienteSnapshotNome ?? "—";
}

/** Filtro da sidebar “Fila de Testes” (número, placa, cliente, subcliente, IMEI). */
export function filtrarOsTesteNaFila(
  items: OsTeste[],
  search: string,
): OsTeste[] {
  if (!search.trim()) return items;
  const term = search.toLowerCase().trim();
  return items.filter(
    (i) =>
      String(i.numero).includes(term) ||
      (i.veiculo?.placa ?? "").toLowerCase().includes(term) ||
      (i.cliente?.nome ?? "").toLowerCase().includes(term) ||
      (i.subcliente?.nome ?? "").toLowerCase().includes(term) ||
      (i.idAparelho?.toLowerCase().includes(term) ?? false),
  );
}
