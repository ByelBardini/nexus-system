import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { ModalSelecaoEKitProps } from "@/types/modal-selecao-ekit";
import type {
  KitResumo,
  AparelhoNoKit,
  KitDetalhe,
} from "@/types/pedidos-config";
import type { AparelhosDestinatariosResponse } from "@/types/pedidos-rastreador";
import {
  KITS_DETALHES_QUERY_KEY,
  fetchKitsDetalhes,
  kitComAparelhosQueryKey,
} from "./pareamento-kits.queries";
import { useKitComAparelhosQuery } from "../../side-panel/hooks/useKitComAparelhosQuery";
import {
  buildAparelhosDisponiveisApiPath,
  buildKitIdsEmOutrosPedidos,
  buildOpcoesCliente,
  buildOpcoesMarcaModelo,
  buildOpcoesOperadora,
  computeAparelhosParaAdicionar,
  filterAparelhosParaSelecao,
  filterKitsCompativeisComPedido,
  filterKitsDisponiveisParaSelecao,
  filterKitsPorTextoBusca,
} from "../modal-selecao-ekit.utils";
import { useModalSelecaoEKitState } from "./useModalSelecaoEKitState";

export function useModalSelecaoEKit({
  open,
  onOpenChange,
  pedido,
  pedidoApi,
  onVincular,
  kitParaEditar,
  kitsPorPedido,
  filtrosPedido,
}: ModalSelecaoEKitProps) {
  const queryClient = useQueryClient();
  const {
    step,
    setStep,
    kitSelecionado,
    setKitSelecionado,
    filtroBusca,
    setFiltroBusca,
    showCriarNovo,
    setShowCriarNovo,
    nomeNovoKit,
    setNomeNovoKit,
    aparelhosSelecionados,
    setAparelhosSelecionados,
    buscaAparelho,
    setBuscaAparelho,
    filtroMarcaModelo,
    setFiltroMarcaModelo,
    filtroOperadora,
    setFiltroOperadora,
    filtroCliente,
    setFiltroCliente,
    destinatarioLote,
    setDestinatarioLote,
    showAllClientes,
    setShowAllClientes,
    resetParaVoltar,
    resetParaFechar,
  } = useModalSelecaoEKitState(open, kitParaEditar);

  const isMisto = pedidoApi?.tipoDestino === "MISTO";

  const { data: kitsDetalhes = [], isLoading: loadingKits } = useQuery<
    KitDetalhe[]
  >({
    queryKey: KITS_DETALHES_QUERY_KEY,
    queryFn: fetchKitsDetalhes,
    enabled: open && step === "selecao",
  });

  const { data: kitComAparelhos, refetch: refetchKit } =
    useKitComAparelhosQuery(
      kitSelecionado?.id ?? null,
      open && step === "edicao" && kitSelecionado != null,
    );

  const { data: destinatariosData } = useQuery<AparelhosDestinatariosResponse>({
    queryKey: ["pedido-aparelhos-destinatarios", pedidoApi?.id],
    queryFn: () =>
      api(`/pedidos-rastreadores/${pedidoApi!.id}/aparelhos-destinatarios`),
    enabled: open && step === "edicao" && isMisto && pedidoApi != null,
  });

  const { data: aparelhosDisponiveis = [] } = useQuery<AparelhoNoKit[]>({
    queryKey: [
      "aparelhos",
      "disponiveis",
      kitSelecionado?.id,
      filtrosPedido,
      isMisto,
      showAllClientes,
    ],
    queryFn: () =>
      api(
        buildAparelhosDisponiveisApiPath(
          pedidoApi,
          filtrosPedido,
          isMisto,
          showAllClientes,
        ),
      ),
    enabled: open && step === "edicao" && kitSelecionado != null,
  });

  const createMutation = useMutation({
    mutationFn: (nome: string) =>
      api<KitResumo>("/aparelhos/pareamento/kits", {
        method: "POST",
        body: JSON.stringify({ nome: nome.trim() }),
      }),
    onSuccess: (data) => {
      toast.success("Kit criado");
      queryClient.invalidateQueries({
        queryKey: ["aparelhos", "pareamento", "kits"],
      });
      setKitSelecionado({
        id: data.id,
        nome: data.nome,
        criadoEm: new Date().toISOString(),
        aparelhos: [],
      });
      setShowCriarNovo(false);
      setNomeNovoKit("");
      setStep("edicao");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar kit"),
  });

  const updateKitMutation = useMutation({
    mutationFn: ({
      aparelhoId,
      kitId,
    }: {
      aparelhoId: number;
      kitId: number | null;
    }) =>
      api(`/aparelhos/pareamento/aparelho/${aparelhoId}/kit`, {
        method: "PATCH",
        body: JSON.stringify({ kitId }),
      }),
    onSuccess: () => {
      if (kitSelecionado != null) {
        queryClient.invalidateQueries({
          queryKey: kitComAparelhosQueryKey(kitSelecionado.id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["aparelhos", "pareamento", "kits"],
      });
      queryClient.invalidateQueries({ queryKey: ["aparelhos", "disponiveis"] });
      refetchKit();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar"),
  });

  const setDestinatariosMutation = useMutation({
    mutationFn: ({
      pedidoId,
      aparelhoIds,
      destinatarioProprietario,
      destinatarioClienteId,
    }: {
      pedidoId: number;
      aparelhoIds: number[];
      destinatarioProprietario: "INFINITY" | "CLIENTE";
      destinatarioClienteId: number | null;
    }) =>
      api(`/pedidos-rastreadores/${pedidoId}/aparelhos-destinatarios`, {
        method: "POST",
        body: JSON.stringify({
          aparelhoIds,
          destinatarioProprietario,
          destinatarioClienteId,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pedido-aparelhos-destinatarios"],
      });
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atribuir destinatário",
      ),
  });

  const removeDestinatarioMutation = useMutation({
    mutationFn: ({
      pedidoId,
      aparelhoId,
    }: {
      pedidoId: number;
      aparelhoId: number;
    }) =>
      api(
        `/pedidos-rastreadores/${pedidoId}/aparelhos-destinatarios/${aparelhoId}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pedido-aparelhos-destinatarios"],
      });
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao remover destinatário",
      ),
  });

  const kitIdsEmOutrosPedidos = useMemo(
    () => buildKitIdsEmOutrosPedidos(pedido?.id, kitsPorPedido),
    [pedido?.id, kitsPorPedido],
  );

  const kitsDisponiveis = useMemo(
    () => filterKitsDisponiveisParaSelecao(kitsDetalhes, kitIdsEmOutrosPedidos),
    [kitsDetalhes, kitIdsEmOutrosPedidos],
  );

  const kitsCompativeis = useMemo(
    () => filterKitsCompativeisComPedido(kitsDisponiveis, pedido),
    [kitsDisponiveis, pedido],
  );

  const kitsFiltrados = useMemo(
    () => filterKitsPorTextoBusca(kitsCompativeis, filtroBusca),
    [kitsCompativeis, filtroBusca],
  );

  const aparelhosParaAdicionar = useMemo(() => {
    const noKit = kitComAparelhos?.aparelhos ?? [];
    return computeAparelhosParaAdicionar(
      aparelhosDisponiveis,
      noKit.map((a) => a.id),
    );
  }, [aparelhosDisponiveis, kitComAparelhos?.aparelhos]);

  const opcoesMarcaModelo = useMemo(
    () => buildOpcoesMarcaModelo(aparelhosParaAdicionar),
    [aparelhosParaAdicionar],
  );

  const opcoesOperadora = useMemo(
    () => buildOpcoesOperadora(aparelhosParaAdicionar),
    [aparelhosParaAdicionar],
  );

  const opcoesCliente = useMemo(
    () => buildOpcoesCliente(aparelhosParaAdicionar),
    [aparelhosParaAdicionar],
  );

  const aparelhosFiltrados = useMemo(
    () =>
      filterAparelhosParaSelecao(aparelhosParaAdicionar, {
        buscaAparelho,
        filtroMarcaModelo,
        filtroOperadora,
        filtroCliente,
      }),
    [
      aparelhosParaAdicionar,
      buscaAparelho,
      filtroMarcaModelo,
      filtroOperadora,
      filtroCliente,
    ],
  );

  function handleEscolherKit(kit: KitDetalhe) {
    setKitSelecionado({
      id: kit.id,
      nome: kit.nome,
      criadoEm: kit.criadoEm,
      aparelhos: [],
    });
    setStep("edicao");
  }

  function handleCriarNovo() {
    if (!nomeNovoKit.trim()) return;
    createMutation.mutate(nomeNovoKit.trim());
  }

  function handleVoltar() {
    resetParaVoltar();
  }

  function handleRemoverAparelho(aparelhoId: number) {
    if (!kitSelecionado) return;
    updateKitMutation.mutate({ aparelhoId, kitId: null });
    if (isMisto && pedidoApi) {
      removeDestinatarioMutation.mutate({ pedidoId: pedidoApi.id, aparelhoId });
    }
  }

  function handleAdicionarSelecionados() {
    if (!kitSelecionado) return;
    if (isMisto && !destinatarioLote) {
      toast.error("Selecione o cliente destinatário antes de adicionar");
      return;
    }
    aparelhosSelecionados.forEach((apId) => {
      updateKitMutation.mutate({ aparelhoId: apId, kitId: kitSelecionado.id });
    });
    if (isMisto && destinatarioLote && pedidoApi) {
      setDestinatariosMutation.mutate({
        pedidoId: pedidoApi.id,
        aparelhoIds: Array.from(aparelhosSelecionados),
        destinatarioProprietario: destinatarioLote.proprietario,
        destinatarioClienteId: destinatarioLote.clienteId,
      });
    }
    setAparelhosSelecionados(new Set());
  }

  function handleSalvarEVincular() {
    if (!kitSelecionado) return;
    const qtd = kitComAparelhos?.aparelhos?.length ?? 0;
    onVincular({ id: kitSelecionado.id, nome: kitSelecionado.nome }, qtd);
    toast.success(`Kit ${kitSelecionado.nome} vinculado`);
    onOpenChange(false);
    handleVoltar();
  }

  function handleClose() {
    onOpenChange(false);
    resetParaFechar();
  }

  const aparelhosNoKit = kitComAparelhos?.aparelhos ?? [];
  const progressQtd = aparelhosNoKit.length;
  const qtdEsperada = pedido?.quantidade ?? 1;

  return {
    step,
    pedido,
    pedidoApi,
    kitSelecionado,
    kitComAparelhos,
    isMisto,
    loadingKits,
    kitsFiltrados,
    kitsDisponiveis,
    kitsCompativeis,
    showCriarNovo,
    setShowCriarNovo,
    nomeNovoKit,
    setNomeNovoKit,
    filtroBusca,
    setFiltroBusca,
    createMutation,
    handleCriarNovo,
    handleEscolherKit,
    handleClose,
    handleVoltar,
    destinatariosData,
    aparelhosNoKit,
    progressQtd,
    qtdEsperada,
    handleRemoverAparelho,
    destinatarioLote,
    setDestinatarioLote,
    showAllClientes,
    setShowAllClientes,
    buscaAparelho,
    setBuscaAparelho,
    filtroMarcaModelo,
    setFiltroMarcaModelo,
    filtroOperadora,
    setFiltroOperadora,
    filtroCliente,
    setFiltroCliente,
    opcoesMarcaModelo,
    opcoesOperadora,
    opcoesCliente,
    aparelhosFiltrados,
    aparelhosSelecionados,
    setAparelhosSelecionados,
    handleAdicionarSelecionados,
    handleSalvarEVincular,
  };
}

export type ModalSelecaoEKitController = ReturnType<typeof useModalSelecaoEKit>;
