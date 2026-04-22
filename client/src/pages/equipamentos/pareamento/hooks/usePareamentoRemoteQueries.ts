import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEquipamentosFullCatalogQueries } from "@/pages/equipamentos/hooks/useEquipamentosCatalogQueries";
import { pareamentoQueryKeys } from "../domain/query-keys";
import {
  filtrarLotesRastreadores,
  filtrarLotesSims,
} from "../domain/parsing";
import type { ModoPareamento, ProprietarioTipo } from "../domain/types";
import type { ClientePareamentoLista } from "../domain/types";
import type { LotePareamentoListItem } from "../domain/types";
import type { MarcaPareamentoCatalog } from "../domain/types";
import type { ModeloPareamentoCatalog } from "../domain/types";
import type { OperadoraPareamentoCatalog } from "../domain/types";
import type { MarcaSimcardPareamentoCatalog } from "../domain/types";

export function usePareamentoRemoteQueries(input: {
  modo: ModoPareamento;
  proprietarioIndividual: ProprietarioTipo;
  proprietarioMassa: ProprietarioTipo;
  proprietarioCsv: ProprietarioTipo;
  loteBuscaRastreador: string;
  loteBuscaSim: string;
}) {
  const needsLotes = input.modo === "massa" || input.modo === "individual";
  const needsCatalogos = input.modo === "individual" || input.modo === "massa";
  const needsClientes =
    input.proprietarioIndividual === "CLIENTE" ||
    input.proprietarioMassa === "CLIENTE" ||
    input.proprietarioCsv === "CLIENTE";

  const { data: lotesRastreadores = [] } = useQuery<LotePareamentoListItem[]>({
    queryKey: pareamentoQueryKeys.lotesRastreadores,
    queryFn: () => api("/aparelhos/pareamento/lotes-rastreadores"),
    enabled: needsLotes,
  });

  const { data: lotesSims = [] } = useQuery<LotePareamentoListItem[]>({
    queryKey: pareamentoQueryKeys.lotesSims,
    queryFn: () => api("/aparelhos/pareamento/lotes-sims"),
    enabled: needsLotes,
  });

  const {
    marcas,
    modelos,
    operadoras,
    marcasSimcard,
  } = useEquipamentosFullCatalogQueries<
    MarcaPareamentoCatalog,
    ModeloPareamentoCatalog,
    OperadoraPareamentoCatalog,
    MarcaSimcardPareamentoCatalog
  >({ enabled: needsCatalogos });

  const { data: clientes = [] } = useQuery<ClientePareamentoLista[]>({
    queryKey: ["clientes-lista"],
    queryFn: () => api("/clientes"),
    enabled: needsClientes,
  });

  const lotesRastreadoresFiltrados = useMemo(
    () => filtrarLotesRastreadores(lotesRastreadores, input.loteBuscaRastreador),
    [lotesRastreadores, input.loteBuscaRastreador],
  );

  const lotesSimsFiltrados = useMemo(
    () =>
      filtrarLotesSims(lotesSims, input.loteBuscaSim, marcasSimcard),
    [lotesSims, input.loteBuscaSim, marcasSimcard],
  );

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas]);
  const operadorasAtivas = useMemo(
    () => operadoras.filter((o) => o.ativo),
    [operadoras],
  );

  return {
    lotesRastreadores,
    lotesSims,
    lotesRastreadoresFiltrados,
    lotesSimsFiltrados,
    marcas,
    modelos,
    operadoras,
    marcasSimcard,
    clientes,
    marcasAtivas,
    operadorasAtivas,
  };
}
