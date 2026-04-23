import type { AparelhoNoKit } from "./pedidos-config-types";

/** Marcas/modelos únicos no formato exibido nos filtros e resumos (ordenado). */
export function collectMarcasModelosLabelsFromAparelhos(
  aparelhos: AparelhoNoKit[],
): string[] {
  const set = new Set<string>();
  for (const a of aparelhos) {
    const mm = [a.marca, a.modelo].filter(Boolean).join(" / ");
    if (mm) set.add(mm);
  }
  return Array.from(set).sort();
}

/** Operadoras únicas (usa SIM vinculado quando `operadora` é nula). */
export function collectOperadorasLabelsFromAparelhos(
  aparelhos: AparelhoNoKit[],
): string[] {
  const set = new Set<string>();
  for (const a of aparelhos) {
    const op = a.operadora ?? a.simVinculado?.operadora;
    if (op) set.add(op);
  }
  return Array.from(set).sort();
}
