import type { MarcaRastreador, ModeloRastreador, MarcaSimcard } from "./equipamentos-config.types";

export function toggleIdInSet(
  previous: Set<number>,
  id: number,
): Set<number> {
  const next = new Set(previous);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function filterMarcasByMarcaOrModeloName(
  marcas: MarcaRastreador[],
  modelos: ModeloRastreador[],
  searchRaw: string,
): MarcaRastreador[] {
  const q = searchRaw.toLowerCase().trim();
  if (!q) return marcas;
  return marcas.filter((m) => {
    const matchMarca = m.nome.toLowerCase().includes(q);
    const matchModelo = modelos.some(
      (mod) => mod.marca.id === m.id && mod.nome.toLowerCase().includes(q),
    );
    return matchMarca || matchModelo;
  });
}

export function filterOperadorasByName<
  T extends { nome: string },
>(operadoras: T[], searchRaw: string): T[] {
  const q = searchRaw.toLowerCase().trim();
  if (!q) return operadoras;
  return operadoras.filter((o) => o.nome.toLowerCase().includes(q));
}

export function filterMarcasSimcardByNomeOuOperadora(
  marcas: MarcaSimcard[],
  searchRaw: string,
): MarcaSimcard[] {
  const q = searchRaw.toLowerCase().trim();
  if (!q) return marcas;
  return marcas.filter(
    (m) =>
      m.nome.toLowerCase().includes(q) ||
      m.operadora.nome.toLowerCase().includes(q),
  );
}

export function buildModelosByMarca(
  modelos: ModeloRastreador[],
): Map<number, ModeloRastreador[]> {
  const map = new Map<number, ModeloRastreador[]>();
  for (const m of modelos) {
    const list = map.get(m.marca.id) ?? [];
    list.push(m);
    map.set(m.marca.id, list);
  }
  return map;
}
