import { useEffect, useState } from "react";
import type { ModalSelecaoEKitProps } from "@/types/modal-selecao-ekit";
import type { KitComAparelhos } from "@/types/pedidos-config";

export function useModalSelecaoEKitState(
  open: boolean,
  kitParaEditar: ModalSelecaoEKitProps["kitParaEditar"],
) {
  const [step, setStep] = useState<"selecao" | "edicao">(() =>
    open && kitParaEditar ? "edicao" : "selecao",
  );
  const [kitSelecionado, setKitSelecionado] = useState<KitComAparelhos | null>(
    () =>
      open && kitParaEditar
        ? {
            id: kitParaEditar.id,
            nome: kitParaEditar.nome,
            criadoEm: "",
            aparelhos: [],
          }
        : null,
  );
  const [filtroBusca, setFiltroBusca] = useState("");
  const [showCriarNovo, setShowCriarNovo] = useState(false);
  const [nomeNovoKit, setNomeNovoKit] = useState("");
  const [aparelhosSelecionados, setAparelhosSelecionados] = useState<
    Set<number>
  >(new Set());
  const [buscaAparelho, setBuscaAparelho] = useState("");
  const [filtroMarcaModelo, setFiltroMarcaModelo] = useState("");
  const [filtroOperadora, setFiltroOperadora] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [destinatarioLote, setDestinatarioLote] = useState<{
    proprietario: "INFINITY" | "CLIENTE";
    clienteId: number | null;
  } | null>(null);
  const [showAllClientes, setShowAllClientes] = useState(false);

  useEffect(() => {
    if (!open || !kitParaEditar) return;
    setStep("edicao");
    setKitSelecionado((prev) => {
      if (
        prev &&
        prev.id === kitParaEditar.id &&
        prev.nome === kitParaEditar.nome
      ) {
        return prev;
      }
      return {
        id: kitParaEditar.id,
        nome: kitParaEditar.nome,
        criadoEm: "",
        aparelhos: [],
      };
    });
  }, [open, kitParaEditar]);

  function limparFiltrosListaAparelhos() {
    setBuscaAparelho("");
    setFiltroMarcaModelo("");
    setFiltroOperadora("");
    setFiltroCliente("");
  }

  function resetParaVoltar() {
    setStep("selecao");
    setKitSelecionado(null);
    setAparelhosSelecionados(new Set());
    setDestinatarioLote(null);
    setShowAllClientes(false);
    limparFiltrosListaAparelhos();
  }

  function resetParaFechar() {
    setStep("selecao");
    setKitSelecionado(null);
    setShowCriarNovo(false);
    setNomeNovoKit("");
    setAparelhosSelecionados(new Set());
    limparFiltrosListaAparelhos();
    setDestinatarioLote(null);
    setShowAllClientes(false);
  }

  return {
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
  };
}
