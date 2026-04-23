import { useMemo } from "react";
import { useClientesComSubclientesQuery } from "@/hooks/useClientesComSubclientesQuery";
import { useTecnicosResumoQuery } from "@/hooks/useTecnicosResumoQuery";
import { useEquipamentosTrioCatalogQueries } from "@/pages/equipamentos/hooks/useEquipamentosCatalogQueries";
import { filterModelosPorMarca } from "../novo-pedido-rastreador.utils";
import type { ClienteComSubclientes } from "../novo-pedido-rastreador.utils";

type ModeloItem = { id: number; nome: string; marcaId: number };

/**
 * Dados de catálogo e listas usados pelo modal (cache alinhado ao resto do app).
 */
export function useNovoPedidoRastreadorCatalogs(open: boolean) {
  const { data: tecnicos = [], isLoading: loadingTecnicos } =
    useTecnicosResumoQuery({ enabled: open });

  const { data: clientesData = [], isLoading: loadingClientes } =
    useClientesComSubclientesQuery({ enabled: open });
  const clientes = clientesData as ClienteComSubclientes[];

  const { marcas, modelos, operadoras } = useEquipamentosTrioCatalogQueries<
    { id: number; nome: string },
    ModeloItem,
    { id: number; nome: string }
  >({ enabled: open });

  const modelosRaw = modelos;
  return {
    tecnicos,
    loadingTecnicos,
    clientes,
    loadingClientes,
    marcas,
    operadoras,
    modelosRaw,
  };
}

export function useModelosFiltradosParaMarca(
  modelosRaw: ModeloItem[],
  marcaEquipamentoId: number | undefined,
) {
  return useMemo(
    () => filterModelosPorMarca(modelosRaw, marcaEquipamentoId),
    [modelosRaw, marcaEquipamentoId],
  );
}
