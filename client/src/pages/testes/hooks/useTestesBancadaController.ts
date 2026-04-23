import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { ComunicacaoResult } from "../lib/testes-types";
import { imeiVinculadoNaBancadaTestes } from "../lib/testes-utils";
import { findRastreadorPorIdentificador } from "../lib/rastreador-format";
import {
  useTestesListaQuery,
  useRastreadoresParaTestesQuery,
} from "./useTestesQueries";
import { useTestesMutations } from "./useTestesMutations";

export function useTestesBancadaController() {
  const [searchParams] = useSearchParams();
  const [selectedOsId, setSelectedOsId] = useState<number | null>(() => {
    const id = searchParams.get("osId");
    return id ? Number(id) : null;
  });
  const [search, setSearch] = useState("");
  const [imeiSearch, setImeiSearch] = useState("");
  const [comunicacaoResult, setComunicacaoResult] =
    useState<ComunicacaoResult | null>("AGUARDANDO");
  const [novoLocalInstalacao, setNovoLocalInstalacao] = useState("");
  const [posChave, setPosChave] = useState<"SIM" | "NAO">("NAO");
  const [observacoes, setObservacoes] = useState("");
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showRetiradaModal, setShowRetiradaModal] = useState(false);
  const pendingLinkRef = useRef<{ osId: number; imei: string } | null>(null);

  const resetAfterOsStatus = useCallback(() => {
    setSelectedOsId(null);
    setImeiSearch("");
    setComunicacaoResult("AGUARDANDO");
    setNovoLocalInstalacao("");
    setPosChave("NAO");
    setObservacoes("");
  }, []);

  const {
    updateStatusOsMutation,
    vincularAparelhoMutation,
    updateStatusAparelhoMutation,
  } = useTestesMutations(resetAfterOsStatus);

  const { data: listaTestando = [] } = useTestesListaQuery(search);

  const selectedOs = useMemo(
    () => listaTestando.find((o) => o.id === selectedOsId) ?? null,
    [listaTestando, selectedOsId],
  );

  const { data: rastreadores = [] } =
    useRastreadoresParaTestesQuery(selectedOs);

  const aparelhoSelecionado = useMemo(() => {
    const id = imeiSearch.trim();
    if (!id) return null;
    return findRastreadorPorIdentificador(rastreadores, id);
  }, [imeiSearch, rastreadores]);

  const vincularOuLimparAparelho = useCallback(
    (idAparelho: string) => {
      if (!selectedOs) return;
      vincularAparelhoMutation.mutate({
        ordemServicoId: selectedOs.id,
        idAparelho: idAparelho.trim(),
      });
    },
    [selectedOs, vincularAparelhoMutation],
  );

  useEffect(() => {
    if (!selectedOs || !imeiSearch.trim()) {
      pendingLinkRef.current = null;
      return;
    }
    const id = imeiSearch.trim();
    if (imeiVinculadoNaBancadaTestes(selectedOs) === id) {
      pendingLinkRef.current = null;
      return;
    }
    if (
      pendingLinkRef.current?.osId === selectedOs.id &&
      pendingLinkRef.current?.imei === id
    )
      return;
    const match = findRastreadorPorIdentificador(rastreadores, id);
    if (match) {
      pendingLinkRef.current = { osId: selectedOs.id, imei: id };
      vincularOuLimparAparelho(id);
    }
  }, [imeiSearch, selectedOs, rastreadores, vincularOuLimparAparelho]);

  const handleTrocarAparelho = useCallback(() => {
    if (selectedOs) {
      vincularAparelhoMutation.mutate({
        ordemServicoId: selectedOs.id,
        idAparelho: "",
      });
    }
    setImeiSearch("");
    setComunicacaoResult("AGUARDANDO");
    setNovoLocalInstalacao("");
  }, [selectedOs, vincularAparelhoMutation]);

  const handleComunicacaoChange = useCallback(
    (v: ComunicacaoResult) => {
      if (v === "NAO_COMUNICOU" && aparelhoSelecionado && selectedOs) {
        const obs = `OS #${selectedOs.numero} - Não comunicou em teste${observacoes ? ` | ${observacoes}` : ""}`;
        updateStatusAparelhoMutation.mutate({
          id: aparelhoSelecionado.id,
          status: aparelhoSelecionado.status,
          observacao: obs,
        });
        vincularAparelhoMutation.mutate({
          ordemServicoId: selectedOs.id,
          idAparelho: "",
        });
        setImeiSearch("");
        setComunicacaoResult("AGUARDANDO");
        toast.info(
          "Observação registrada no rastreador. Selecione outro aparelho.",
        );
      } else {
        setComunicacaoResult(v);
      }
    },
    [
      aparelhoSelecionado,
      selectedOs,
      observacoes,
      vincularAparelhoMutation,
      updateStatusAparelhoMutation,
    ],
  );

  const handleCancelarClick = useCallback(() => {
    setShowCancelarModal(true);
  }, []);

  const handleReagendar = useCallback(() => {
    if (!selectedOs) return;
    setShowCancelarModal(false);
    updateStatusOsMutation.mutate({ id: selectedOs.id, status: "AGENDADO" });
  }, [selectedOs, updateStatusOsMutation]);

  const handleCancelarOs = useCallback(() => {
    if (!selectedOs) return;
    setShowCancelarModal(false);
    updateStatusOsMutation.mutate({ id: selectedOs.id, status: "CANCELADO" });
  }, [selectedOs, updateStatusOsMutation]);

  const handleRetiradaRealizada = useCallback(() => {
    setShowRetiradaModal(true);
  }, []);

  const handleRetiradaConfirmar = useCallback(
    (aparelhoEncontrado: boolean) => {
      if (!selectedOs) return;
      setShowRetiradaModal(false);
      const hoje = new Date().toLocaleDateString("pt-BR");
      const obs = `Data retirada: ${hoje} | Aparelho encontrado: ${aparelhoEncontrado ? "Sim" : "Não"}`;
      updateStatusOsMutation.mutate({
        id: selectedOs.id,
        status: "AGUARDANDO_CADASTRO",
        observacao: obs,
      });
    },
    [selectedOs, updateStatusOsMutation],
  );

  const canFinalizar =
    !!imeiVinculadoNaBancadaTestes(selectedOs) &&
    comunicacaoResult === "COMUNICANDO" &&
    !!novoLocalInstalacao.trim();

  const handleFinalizar = useCallback(() => {
    if (!selectedOs) {
      toast.error("Selecione uma OS na fila");
      return;
    }
    if (!imeiVinculadoNaBancadaTestes(selectedOs)) {
      toast.error("Selecione e vincule um aparelho para finalizar");
      return;
    }
    if (comunicacaoResult !== "COMUNICANDO") {
      toast.error('Selecione "Comunicando" para finalizar o teste');
      return;
    }
    if (!novoLocalInstalacao.trim()) {
      toast.error("Informe o novo local de instalação");
      return;
    }
    const obs = observacoes.trim() ? observacoes : undefined;
    updateStatusOsMutation.mutate({
      id: selectedOs.id,
      status: "TESTES_REALIZADOS",
      observacao: obs,
      localInstalacao: novoLocalInstalacao.trim(),
      posChave,
    });
  }, [
    selectedOs,
    comunicacaoResult,
    observacoes,
    novoLocalInstalacao,
    posChave,
    updateStatusOsMutation,
  ]);

  useEffect(() => {
    if (
      selectedOsId !== null &&
      listaTestando.length > 0 &&
      !listaTestando.find((o) => o.id === selectedOsId)
    ) {
      setSelectedOsId(null);
    }
  }, [listaTestando, selectedOsId]);

  useEffect(() => {
    const fromUrl = searchParams.get("osId");
    if (!selectedOsId && listaTestando.length > 0 && !fromUrl) {
      setSelectedOsId(listaTestando[0].id);
    }
  }, [listaTestando, selectedOsId, searchParams]);

  useEffect(() => {
    setImeiSearch(imeiVinculadoNaBancadaTestes(selectedOs));
  }, [selectedOs]);

  return {
    listaTestando,
    selectedOsId,
    setSelectedOsId,
    search,
    setSearch,
    imeiSearch,
    setImeiSearch,
    comunicacaoResult,
    novoLocalInstalacao,
    setNovoLocalInstalacao,
    posChave,
    setPosChave,
    observacoes,
    setObservacoes,
    showCancelarModal,
    setShowCancelarModal,
    showRetiradaModal,
    setShowRetiradaModal,
    selectedOs,
    rastreadores,
    aparelhoSelecionado,
    handleTrocarAparelho,
    handleComunicacaoChange,
    handleCancelarClick,
    handleReagendar,
    handleCancelarOs,
    handleRetiradaRealizada,
    handleRetiradaConfirmar,
    handleFinalizar,
    canFinalizar,
    updateStatusOsMutation,
  };
}
