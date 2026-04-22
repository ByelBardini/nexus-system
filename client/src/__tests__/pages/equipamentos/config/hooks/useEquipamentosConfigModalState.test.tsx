import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEquipamentosConfigModalState } from "@/pages/equipamentos/config/hooks/useEquipamentosConfigModalState";
import type { MarcaRastreador } from "@/pages/equipamentos/config/domain/equipamentos-config.types";

describe("useEquipamentosConfigModalState", () => {
  it("closeModalMarca reseta abertura, edição e nome", () => {
    const marca: MarcaRastreador = {
      id: 1,
      nome: "M",
      ativo: true,
      _count: { modelos: 0 },
    };
    const { result } = renderHook(() => useEquipamentosConfigModalState());
    act(() => {
      result.current.setModalMarcaOpen(true);
      result.current.setEditingMarca(marca);
      result.current.setNomeMarca("X");
    });
    act(() => result.current.closeModalMarca());
    expect(result.current.modalMarcaOpen).toBe(false);
    expect(result.current.editingMarca).toBeNull();
    expect(result.current.nomeMarca).toBe("");
  });

  it("closeModalPlanoSimcard reseta id de marca e MB", () => {
    const { result } = renderHook(() => useEquipamentosConfigModalState());
    act(() => {
      result.current.setModalPlanoSimcardOpen(true);
      result.current.setMarcaSimcardIdForPlano(99);
      result.current.setPlanoMbPlanoSimcard(128);
    });
    act(() => result.current.closeModalPlanoSimcard());
    expect(result.current.modalPlanoSimcardOpen).toBe(false);
    expect(result.current.marcaSimcardIdForPlano).toBeNull();
    expect(result.current.planoMbPlanoSimcard).toBe("");
  });

  it("estado de busca inicia vazio e aceita setSearchMarcas", () => {
    const { result } = renderHook(() => useEquipamentosConfigModalState());
    expect(result.current.searchMarcas).toBe("");
    act(() => result.current.setSearchMarcas("abc"));
    expect(result.current.searchMarcas).toBe("abc");
  });
});
