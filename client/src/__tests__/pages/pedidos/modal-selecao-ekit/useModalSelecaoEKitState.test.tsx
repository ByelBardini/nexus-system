import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useModalSelecaoEKitState } from "@/pages/pedidos/modal-selecao-ekit/hooks/useModalSelecaoEKitState";

describe("useModalSelecaoEKitState", () => {
  it("inicia em seleção sem kit quando modal fechado", () => {
    const { result } = renderHook(() =>
      useModalSelecaoEKitState(false, undefined),
    );
    expect(result.current.step).toBe("selecao");
    expect(result.current.kitSelecionado).toBeNull();
  });

  it("inicia em edição com kit placeholder quando aberto com kitParaEditar", () => {
    const { result } = renderHook(() =>
      useModalSelecaoEKitState(true, { id: 7, nome: "Kit-X" }),
    );
    expect(result.current.step).toBe("edicao");
    expect(result.current.kitSelecionado).toEqual({
      id: 7,
      nome: "Kit-X",
      criadoEm: "",
      aparelhos: [],
    });
  });

  it("resetParaVoltar limpa kit, seleção e filtros mas não o fluxo criar kit", () => {
    const { result } = renderHook(() =>
      useModalSelecaoEKitState(true, { id: 1, nome: "K" }),
    );
    act(() => {
      result.current.setShowCriarNovo(true);
      result.current.setNomeNovoKit("Novo nome");
      result.current.setBuscaAparelho("busca");
      result.current.setAparelhosSelecionados(new Set([1, 2]));
      result.current.resetParaVoltar();
    });
    expect(result.current.step).toBe("selecao");
    expect(result.current.kitSelecionado).toBeNull();
    expect(result.current.aparelhosSelecionados.size).toBe(0);
    expect(result.current.buscaAparelho).toBe("");
    expect(result.current.showCriarNovo).toBe(true);
    expect(result.current.nomeNovoKit).toBe("Novo nome");
  });

  it("resetParaFechar também zera criar kit e nomeNovoKit", () => {
    const { result } = renderHook(() =>
      useModalSelecaoEKitState(true, { id: 1, nome: "K" }),
    );
    act(() => {
      result.current.setShowCriarNovo(true);
      result.current.setNomeNovoKit("X");
      result.current.setFiltroCliente("c");
      result.current.resetParaFechar();
    });
    expect(result.current.showCriarNovo).toBe(false);
    expect(result.current.nomeNovoKit).toBe("");
    expect(result.current.filtroCliente).toBe("");
    expect(result.current.step).toBe("selecao");
  });

  it("quando open+kitParaEditar mudam, sincroniza step e kit (edge: troca de id)", () => {
    type P = { open: boolean; kit?: { id: number; nome: string } };
    const { result, rerender } = renderHook(
      (props: P) => useModalSelecaoEKitState(props.open, props.kit),
      { initialProps: { open: false } as P },
    );
    rerender({ open: true, kit: { id: 10, nome: "A" } });
    expect(result.current.step).toBe("edicao");
    expect(result.current.kitSelecionado?.id).toBe(10);

    rerender({ open: true, kit: { id: 20, nome: "B" } });
    expect(result.current.kitSelecionado?.id).toBe(20);
    expect(result.current.kitSelecionado?.nome).toBe("B");
  });
});
