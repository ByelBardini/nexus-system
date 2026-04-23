import type { MarcaCatalog, MarcaModeloCatalog, MarcaSimcardRow } from "./catalog.types";

/**
 * Rastreadores: marca e modelo no form são **nomes**; obtém o par de ids para filtro de débito.
 * Se marca/modelo preenchidos mas não resolvidos nas listas, retorna `null` (sem filtro adicional).
 */
export function resolveMarcaModeloIdsPorNome(
  marcasAtivas: MarcaCatalog[],
  modelosDisponiveis: MarcaModeloCatalog[],
  watchMarca: string,
  watchModelo: string,
): { marcaId: number; modeloId: number } | null {
  if (!watchMarca || !watchModelo) return null;
  const marca = marcasAtivas.find((m) => m.nome === watchMarca);
  const modelo = modelosDisponiveis.find((m) => m.nome === watchModelo);
  if (!marca || !modelo) return null;
  return { marcaId: marca.id, modeloId: modelo.id };
}

/**
 * Lote: marca e modelo no form são **ids** (string). Mantém o mesmo critério do cadastro em lote.
 */
export function resolveMarcaModeloFiltroLote(
  watchMarca: string,
  watchModelo: string,
): { marcaId: number; modeloId: number } | null {
  if (!watchMarca || !watchModelo) return null;
  return { marcaId: Number(watchMarca), modeloId: Number(watchModelo) };
}

export function getModelosDisponiveisPorMarcaNome(
  modelos: MarcaModeloCatalog[],
  marcasAtivas: MarcaCatalog[],
  watchMarca: string,
): MarcaModeloCatalog[] {
  if (!watchMarca) return [];
  const marcaEncontrada = marcasAtivas.find((m) => m.nome === watchMarca);
  if (!marcaEncontrada) return [];
  return modelos.filter(
    (m) => m.marca.id === marcaEncontrada.id && m.ativo,
  );
}

export function getModelosDisponiveisPorMarcaId(
  modelos: MarcaModeloCatalog[],
  watchMarca: string,
): MarcaModeloCatalog[] {
  if (!watchMarca) return [];
  const id = Number(watchMarca);
  if (Number.isNaN(id)) return [];
  return modelos.filter((m) => m.marca?.id === id && m.ativo);
}

export function selectAparelhosIdentificadoresList(
  data: unknown,
): { identificador: string; lote?: { referencia: string } | null }[] {
  return (
    data as {
      identificador?: string;
      lote?: { referencia: string } | null;
    }[]
  )
    .filter((a) => a.identificador)
    .map((a) => ({ identificador: a.identificador!, lote: a.lote }));
}

export function idOperadoraParaFiltroSim(
  operadoras: { id: number; nome: string }[],
  operadoraValue: string,
  mode: "nome" | "id",
): number | null {
  if (!operadoraValue) return null;
  if (mode === "id") {
    const n = Number(operadoraValue);
    return Number.isNaN(n) ? null : n;
  }
  return operadoras.find((o) => o.nome === operadoraValue)?.id ?? null;
}

export function filtrarMarcasSimcardPorOperadoraId(
  marcas: MarcaSimcardRow[] | undefined,
  operadoraId: number | null,
) {
  return (marcas ?? []).filter(
    (m) => !operadoraId || m.operadoraId === operadoraId,
  );
}
