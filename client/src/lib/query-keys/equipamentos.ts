/**
 * Chaves de cache compartilhadas para listagens de equipamentos / catálogos.
 * Usar as mesmas referências em toda a app para invalidação consistente.
 */
export const equipamentosQueryKeys = {
  marcas: ["marcas"] as const,
  modelos: ["modelos"] as const,
  operadoras: ["operadoras"] as const,
  /** Listagem usada em telas que precisam de todas as marcas de simcard (ex.: config). */
  marcasSimcard: ["marcas-simcard"] as const,
  /**
   * Listagem com escopo por operadora (ex.: cadastro de aparelho).
   * Compatível com parcial: invalidateQueries({ queryKey: marcasSimcardBase }) invalida variações.
   */
  marcasSimcardScoped: (operadoraId: number | "all") =>
    ["marcas-simcard", operadoraId] as const,
} as const;
