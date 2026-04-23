import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { buildCadastroRastreamentoPeriodoQuery } from "@/lib/cadastro-rastreamento-periodo";
import {
  buildTextoCopiarTodosCadastroRast,
  getAuxilioCopiaItens,
} from "@/lib/cadastro-rastreamento-copy";
import { mapCadastroRastreamentoOS } from "@/lib/cadastro-rastreamento-mapper";
import type {
  CadastroRastreamentoListagemResposta,
  OrdemCadastro,
  Plataforma,
  StatusCadastro,
} from "@/types/cadastro-rastreamento";
import { cadastroRastreamentoAcaoLabels } from "@/lib/cadastro-rastreamento-tipo-mappers";
import { toast } from "sonner";

const CADASTRO_RAST_QUERY_KEY = ["cadastro-rastreamento"] as const;

export function useCadastroRastreamento() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [plataforma, setPlataforma] = useState<Plataforma>("GETRAK");
  const [filtroStatus, setFiltroStatus] = useState<StatusCadastro | "TODOS">(
    "TODOS",
  );
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [periodo, setPeriodo] = useState("hoje");

  const { dataInicio, dataFim } = useMemo(
    () =>
      buildCadastroRastreamentoPeriodoQuery(
        periodo as "hoje" | "semana" | "mes",
      ),
    [periodo],
  );

  const { data: queryResult, isLoading } = useQuery({
    queryKey: [...CADASTRO_RAST_QUERY_KEY, dataInicio, dataFim],
    queryFn: () => {
      const q = new URLSearchParams({
        dataInicio,
        dataFim,
        limit: "100",
      });
      return api<CadastroRastreamentoListagemResposta>(
        `/cadastro-rastreamento?${q.toString()}`,
      );
    },
  });

  const ordens = useMemo(
    () => (queryResult?.data ?? []).map(mapCadastroRastreamentoOS),
    [queryResult],
  );

  const mutIniciar = useMutation({
    mutationFn: (id: number) =>
      api(`/cadastro-rastreamento/${id}/iniciar`, { method: "PATCH" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...CADASTRO_RAST_QUERY_KEY] }),
  });

  const mutConcluir = useMutation({
    mutationFn: ({ id, plataforma: p }: { id: number; plataforma: Plataforma }) =>
      api(`/cadastro-rastreamento/${id}/concluir`, {
        method: "PATCH",
        body: JSON.stringify({ plataforma: p }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...CADASTRO_RAST_QUERY_KEY] }),
  });

  const selectedOrdem = ordens.find((o) => o.id === selectedId) ?? null;

  const tecnicos = useMemo(
    () => [...new Set(ordens.map((o) => o.tecnico).filter((t) => t !== "—"))],
    [ordens],
  );

  const ordensFiltradas = ordens.filter((o) => {
    const matchStatus = filtroStatus === "TODOS" || o.status === filtroStatus;
    const matchTecnico = !filtroTecnico || o.tecnico === filtroTecnico;
    const matchTipo = !filtroTipo || o.tipoRegistro === filtroTipo;
    return matchStatus && matchTecnico && matchTipo;
  });

  const statsAguardando = ordens.filter(
    (o) => o.status === "AGUARDANDO",
  ).length;
  const statsEmCadastro = ordens.filter(
    (o) => o.status === "EM_CADASTRO",
  ).length;
  const statsConcluido = ordens.filter(
    (o) => o.status === "CONCLUIDO",
  ).length;

  const temFiltroAtivo = Boolean(filtroTecnico || filtroTipo);
  const isMutating = mutIniciar.isPending || mutConcluir.isPending;

  const auxilioCopiaItens = selectedOrdem
    ? getAuxilioCopiaItens(selectedOrdem)
    : [];

  function handleAvancarStatus() {
    if (!selectedOrdem || selectedOrdem.status === "CONCLUIDO") return;
    const acao = cadastroRastreamentoAcaoLabels[selectedOrdem.tipoRegistro];
    if (selectedOrdem.status === "AGUARDANDO") {
      mutIniciar.mutate(selectedOrdem.id, {
        onSuccess: () => toast.success(acao.toastIniciado),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao iniciar"),
      });
    } else {
      mutConcluir.mutate(
        { id: selectedOrdem.id, plataforma },
        {
          onSuccess: () => toast.success(`${acao.concluido}!`),
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Erro ao concluir",
            ),
        },
      );
    }
  }

  function copiar(valor: string, label: string) {
    navigator.clipboard.writeText(valor);
    toast.success(`${label} copiado!`);
  }

  function copiarTodos(ordem: OrdemCadastro) {
    navigator.clipboard.writeText(buildTextoCopiarTodosCadastroRast(ordem));
    toast.success("Dados principais copiados!");
  }

  return {
    selectedId,
    setSelectedId,
    plataforma,
    setPlataforma,
    filtroStatus,
    setFiltroStatus,
    filtroTecnico,
    setFiltroTecnico,
    filtroTipo,
    setFiltroTipo,
    periodo,
    setPeriodo,
    isLoading,
    ordens,
    ordensFiltradas,
    tecnicos,
    selectedOrdem,
    statsAguardando,
    statsEmCadastro,
    statsConcluido,
    temFiltroAtivo,
    isMutating,
    handleAvancarStatus,
    copiar,
    copiarTodos,
    auxilioCopiaItens,
  };
}

export { CADASTRO_RAST_QUERY_KEY };
