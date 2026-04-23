import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiDownloadBlob } from "@/lib/api";
import type {
  OrdemServicoDetalhe,
  OrdensServicoPaginatedResult,
  OrdensServicoResumo,
} from "../shared/ordens-servico.types";

export function useOrdensServicoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [expandedOsId, setExpandedOsId] = useState<number | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [confirmIniciarOsId, setConfirmIniciarOsId] = useState<number | null>(
    null,
  );
  const [showRetiradaModal, setShowRetiradaModal] = useState<number | null>(
    null,
  );

  const canCreate = hasPermission("AGENDAMENTO.OS.CRIAR");
  const canEditOs = hasPermission("AGENDAMENTO.OS.EDITAR");

  const { data: resumo, isLoading: loadingResumo } =
    useQuery<OrdensServicoResumo>({
      queryKey: ["ordens-servico", "resumo"],
      queryFn: () => api("/ordens-servico/resumo"),
    });

  const { data: lista, isLoading: loadingLista } =
    useQuery<OrdensServicoPaginatedResult>({
      queryKey: ["ordens-servico", page, search, statusFilter],
      queryFn: () => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "15");
        if (search) params.set("search", search);
        if (statusFilter && statusFilter !== "TODOS")
          params.set("status", statusFilter);
        return api(`/ordens-servico?${params}`);
      },
    });

  const { data: osDetalhe, isLoading: loadingDetalhe } =
    useQuery<OrdemServicoDetalhe>({
      queryKey: ["ordens-servico", "detalhe", expandedOsId],
      queryFn: () => api(`/ordens-servico/${expandedOsId}`),
      enabled: !!expandedOsId,
    });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      observacao,
    }: {
      id: number;
      status: string;
      observacao?: string;
    }) =>
      api(`/ordens-servico/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, observacao: observacao || undefined }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      toast.success(
        variables.status === "AGUARDANDO_CADASTRO"
          ? "Retirada registrada"
          : "Status atualizado",
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleStatusClick(status: string) {
    setStatusFilter(status);
    setPage(1);
  }

  function handleIniciarTestes(id: number) {
    updateStatusMutation.mutate({ id, status: "EM_TESTES" });
  }

  function handleRetiradaConfirmar(aparelhoEncontrado: boolean) {
    const id = showRetiradaModal;
    if (id == null) return;
    setShowRetiradaModal(null);
    const hoje = new Date().toLocaleDateString("pt-BR");
    const obs = `Data retirada: ${hoje} | Aparelho encontrado: ${aparelhoEncontrado ? "Sim" : "Não"}`;
    updateStatusMutation.mutate({
      id,
      status: "AGUARDANDO_CADASTRO",
      observacao: obs,
    });
  }

  function handleEnviarParaCadastro(id: number) {
    updateStatusMutation.mutate({ id, status: "AGUARDANDO_CADASTRO" });
  }

  async function handleAbrirImpressao(id: number) {
    setDownloadingPdf(true);
    try {
      const blob = await apiDownloadBlob(`/ordens-servico/${id}/pdf`, 30_000);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordem-servico-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF baixado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao baixar PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }

  return {
    navigate,
    resumo,
    loadingResumo,
    lista,
    loadingLista,
    osDetalhe,
    loadingDetalhe,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    expandedOsId,
    setExpandedOsId,
    downloadingPdf,
    confirmIniciarOsId,
    setConfirmIniciarOsId,
    showRetiradaModal,
    setShowRetiradaModal,
    canCreate,
    canEditOs,
    updateStatusMutation,
    handleStatusClick,
    handleIniciarTestes,
    handleRetiradaConfirmar,
    handleEnviarParaCadastro,
    handleAbrirImpressao,
  };
}
