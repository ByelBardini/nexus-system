import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTecnicoFormModal } from "@/pages/tecnicos/hooks/useTecnicoFormModal";
import type { Tecnico } from "@/pages/tecnicos/lib/tecnicos.types";

vi.mock("@/hooks/useBrasilAPI", () => ({
  useUFs: () => ({ data: [{ sigla: "SP", nome: "São Paulo" }] }),
  useMunicipios: () => ({ data: [{ nome: "Campinas" }] }),
}));

function baseTecnico(overrides: Partial<Tecnico> = {}): Tecnico {
  return {
    id: 99,
    nome: "API Tech",
    cpfCnpj: "123",
    telefone: "11999999999",
    cidade: "Campinas",
    estado: "SP",
    cep: "13000",
    logradouro: "Rua A",
    numero: "1",
    complemento: "",
    bairro: "Centro",
    cidadeEndereco: "Campinas",
    estadoEndereco: "SP",
    latitude: null,
    longitude: null,
    geocodingPrecision: null,
    ativo: false,
    precos: {
      instalacaoComBloqueio: "10.50",
      instalacaoSemBloqueio: 20,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    },
    ...overrides,
  };
}

describe("useTecnicoFormModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("openCreateModal limpa edição e abre", () => {
    const { result } = renderHook(() => useTecnicoFormModal());
    act(() => {
      result.current.openCreateModal();
    });
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.editingTecnico).toBeNull();
    expect(result.current.form.getValues("nome")).toBe("");
    expect(result.current.form.getValues("ativo")).toBe(true);
  });

  it("openEditModal preenche formulário a partir da API", () => {
    const { result } = renderHook(() => useTecnicoFormModal());
    const t = baseTecnico();
    act(() => {
      result.current.openEditModal(t);
    });
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.editingTecnico?.id).toBe(99);
    expect(result.current.form.getValues("nome")).toBe("API Tech");
    expect(result.current.form.getValues("ativo")).toBe(false);
    expect(result.current.form.getValues("instalacaoComBloqueio")).toBe(1050);
    expect(result.current.form.getValues("instalacaoSemBloqueio")).toBe(2000);
  });

  it("closeModal reseta estado", () => {
    const { result } = renderHook(() => useTecnicoFormModal());
    act(() => {
      result.current.openEditModal(baseTecnico());
    });
    act(() => {
      result.current.closeModal();
    });
    expect(result.current.modalOpen).toBe(false);
    expect(result.current.editingTecnico).toBeNull();
  });

  it("handleAddressFound preenche campos de endereço", () => {
    const { result } = renderHook(() => useTecnicoFormModal());
    act(() => {
      result.current.openCreateModal();
    });
    act(() => {
      result.current.handleAddressFound({
        cep: "30000000",
        logradouro: "Rua X",
        bairro: "Bairro Y",
        localidade: "City",
        uf: "MG",
        complemento: "Ap 2",
      });
    });
    expect(result.current.form.getValues("logradouro")).toBe("Rua X");
    expect(result.current.form.getValues("bairro")).toBe("Bairro Y");
    expect(result.current.form.getValues("cidadeEndereco")).toBe("City");
    expect(result.current.form.getValues("estadoEndereco")).toBe("MG");
    expect(result.current.form.getValues("complemento")).toBe("Ap 2");
  });

  it("edge: CEP sem complemento não sobrescreve complemento", () => {
    const { result } = renderHook(() => useTecnicoFormModal());
    act(() => {
      result.current.openCreateModal();
      result.current.form.setValue("complemento", "Manual");
    });
    act(() => {
      result.current.handleAddressFound({
        cep: "01000000",
        logradouro: "Rua",
        bairro: "B",
        localidade: "C",
        uf: "SP",
        complemento: "",
      });
    });
    expect(result.current.form.getValues("complemento")).toBe("Manual");
  });
});
