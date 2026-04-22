import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { equipamentosQueryKeys } from "@/lib/query-keys/equipamentos";

type EnabledOption = { enabled?: boolean };

/**
 * Catálogos básicos (marca, modelo, operadora) com a mesma chave e flag `enabled` unificada.
 * Usado no cadastro de aparelho em conjunto com `useEquipamentosMarcasSimcardListQuery`.
 */
export function useEquipamentosTrioCatalogQueries<
  TMarca = unknown,
  TModelo = unknown,
  TOperadora = unknown,
>(options?: EnabledOption) {
  const enabled = options?.enabled !== false;

  const { data: marcas = [], isLoading: loadingMarcas } = useQuery<TMarca[]>({
    queryKey: equipamentosQueryKeys.marcas,
    queryFn: () => api("/equipamentos/marcas"),
    enabled,
  });

  const { data: modelos = [], isLoading: loadingModelos } = useQuery<TModelo[]>(
    {
      queryKey: equipamentosQueryKeys.modelos,
      queryFn: () => api("/equipamentos/modelos"),
      enabled,
    },
  );

  const { data: operadoras = [], isLoading: loadingOperadoras } = useQuery<
    TOperadora[]
  >({
    queryKey: equipamentosQueryKeys.operadoras,
    queryFn: () => api("/equipamentos/operadoras"),
    enabled,
  });

  return {
    marcas,
    modelos,
    operadoras,
    loadingMarcas,
    loadingModelos,
    loadingOperadoras,
  };
}

type MarcasSimcardCadastroOptions = {
  /** `null` = lista geral; número = filtra por operadora. */
  operadoraId: number | null;
  queryEnabled: boolean;
};

/**
 * Listagem de marcas de simcard com escopo por operadora (mesmas chaves do cadastro de aparelho).
 */
export function useEquipamentosMarcasSimcardListQuery<TMarcaSim = unknown>(
  options: MarcasSimcardCadastroOptions,
) {
  const { operadoraId, queryEnabled } = options;

  const { data: marcasSimcard = [], isLoading: loadingMarcasSimcard } = useQuery<
    TMarcaSim[]
  >({
    queryKey: equipamentosQueryKeys.marcasSimcardScoped(
      operadoraId ?? "all",
    ),
    queryFn: () =>
      operadoraId
        ? api(
            `/equipamentos/marcas-simcard?operadoraId=${operadoraId}`,
          )
        : api("/equipamentos/marcas-simcard"),
    enabled: queryEnabled,
  });

  return { marcasSimcard, loadingMarcasSimcard };
}

type FullCatalogOptions = EnabledOption;

/**
 * Quatro listagens (marca, modelo, operadora, marcas de sim card lista completa).
 * Usado na configuração de equipamentos e no pareamento (com `enabled` condicional).
 */
export function useEquipamentosFullCatalogQueries<
  TMarca = unknown,
  TModelo = unknown,
  TOperadora = unknown,
  TMarcaSim = unknown,
>(options?: FullCatalogOptions) {
  const enabled = options?.enabled !== false;

  const { data: marcas = [], isLoading: loadingMarcas } = useQuery<TMarca[]>({
    queryKey: equipamentosQueryKeys.marcas,
    queryFn: () => api("/equipamentos/marcas"),
    enabled,
  });

  const { data: modelos = [], isLoading: loadingModelos } = useQuery<TModelo[]>(
    {
      queryKey: equipamentosQueryKeys.modelos,
      queryFn: () => api("/equipamentos/modelos"),
      enabled,
    },
  );

  const { data: operadoras = [], isLoading: loadingOperadoras } = useQuery<
    TOperadora[]
  >({
    queryKey: equipamentosQueryKeys.operadoras,
    queryFn: () => api("/equipamentos/operadoras"),
    enabled,
  });

  const { data: marcasSimcard = [], isLoading: loadingMarcasSimcard } = useQuery<
    TMarcaSim[]
  >({
    queryKey: equipamentosQueryKeys.marcasSimcard,
    queryFn: () => api("/equipamentos/marcas-simcard"),
    enabled,
  });

  const isLoading =
    loadingMarcas || loadingModelos || loadingOperadoras || loadingMarcasSimcard;

  return {
    marcas,
    modelos,
    operadoras,
    marcasSimcard,
    loadingMarcas,
    loadingModelos,
    loadingOperadoras,
    loadingMarcasSimcard,
    isLoading,
  };
}
