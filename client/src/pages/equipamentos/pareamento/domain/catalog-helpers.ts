import type { MarcaPareamentoCatalog } from "./types";
import type { ModeloPareamentoCatalog } from "./types";
import type { OperadoraPareamentoCatalog } from "./types";
import type { MarcaSimcardPareamentoCatalog } from "./types";

export function filterModelosPorNomeMarca(
  nomeMarca: string,
  marcasAtivas: MarcaPareamentoCatalog[],
  modelos: ModeloPareamentoCatalog[],
): ModeloPareamentoCatalog[] {
  if (!nomeMarca) return [];
  const marcaEncontrada = marcasAtivas.find((m) => m.nome === nomeMarca);
  if (!marcaEncontrada) return [];
  return modelos.filter((m) => m.marca.id === marcaEncontrada.id);
}

export function filterMarcasSimcardPorNomeOperadora(
  nomeOperadora: string,
  operadorasAtivas: OperadoraPareamentoCatalog[],
  marcasSimcard: MarcaSimcardPareamentoCatalog[],
): MarcaSimcardPareamentoCatalog[] {
  const opId = operadorasAtivas.find((o) => o.nome === nomeOperadora)?.id;
  if (!opId) return [];
  return marcasSimcard.filter((m) => m.operadoraId === opId);
}
