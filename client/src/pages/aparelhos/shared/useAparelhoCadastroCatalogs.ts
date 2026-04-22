import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  useEquipamentosMarcasSimcardListQuery,
  useEquipamentosTrioCatalogQueries,
} from "@/pages/equipamentos/hooks/useEquipamentosCatalogQueries";
import type {
  ClienteLista,
  MarcaCatalog,
  MarcaModeloCatalog,
  MarcaSimcardRow,
  OperadoraCatalog,
} from "./catalog.types";
import {
  idOperadoraParaFiltroSim,
  selectAparelhosIdentificadoresList,
} from "./catalog.helpers";
import type { DebitoRastreadorApi } from "./debito-rastreador";

export type OperadoraSelecionadaInput = {
  value: string;
  /** `nome`: form guarda o nome (cadastro individual). `id`: form guarda o id em string (lote). */
  idMode: "nome" | "id";
};

export function useAparelhoCadastroCatalogs(options: {
  marcasSimcardQueryEnabled: boolean;
  operadora: OperadoraSelecionadaInput;
  debitosQueryEnabled: boolean;
}) {
  const { marcasSimcardQueryEnabled, operadora, debitosQueryEnabled } =
    options;

  const { data: clientes = [] } = useQuery<ClienteLista[]>({
    queryKey: ["clientes-lista"],
    queryFn: () => api("/clientes"),
  });

  const { marcas, modelos, operadoras } =
    useEquipamentosTrioCatalogQueries<
      MarcaCatalog,
      MarcaModeloCatalog,
      OperadoraCatalog
    >();

  const operadoraIdParaMarcasSimcard = useMemo(
    () =>
      idOperadoraParaFiltroSim(
        operadoras,
        operadora.value,
        operadora.idMode === "id" ? "id" : "nome",
      ),
    [operadoras, operadora.value, operadora.idMode],
  );

  const { marcasSimcard } = useEquipamentosMarcasSimcardListQuery<MarcaSimcardRow>({
    operadoraId: operadoraIdParaMarcasSimcard,
    queryEnabled: marcasSimcardQueryEnabled,
  });

  const { data: debitosData } = useQuery<{ data: DebitoRastreadorApi[] }>({
    queryKey: ["debitos-rastreadores", "aberto"],
    queryFn: () => api("/debitos-rastreadores?status=aberto&limit=500"),
    enabled: debitosQueryEnabled,
  });

  const { data: aparelhosExistentes = [] } = useQuery<
    { identificador: string; lote?: { referencia: string } | null }[]
  >({
    queryKey: ["aparelhos-ids"],
    queryFn: () => api("/aparelhos"),
    select: selectAparelhosIdentificadoresList,
  });

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas]);
  const operadorasAtivas = useMemo(
    () => operadoras.filter((o) => o.ativo),
    [operadoras],
  );

  return {
    clientes,
    marcas,
    modelos,
    operadoras,
    marcasSimcard,
    debitosData,
    aparelhosExistentes,
    marcasAtivas,
    operadorasAtivas,
    operadoraIdParaMarcasSimcard,
  };
}
