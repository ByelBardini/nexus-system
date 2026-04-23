import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useTecnicosTableState } from "@/pages/tecnicos/hooks/useTecnicosTableState";
import type { Tecnico } from "@/pages/tecnicos/lib/tecnicos.types";

function makeList(n: number): Tecnico[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    nome: `Tech ${i + 1}`,
    cpfCnpj: null,
    telefone: null,
    cidade: "X",
    estado: "SP",
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidadeEndereco: null,
    estadoEndereco: null,
    latitude: null,
    longitude: null,
    geocodingPrecision: null,
    ativo: true,
  }));
}

describe("useTecnicosTableState", () => {
  it("pagina e reseta página ao mudar busca", () => {
    const { result } = renderHook(() => useTecnicosTableState(makeList(11)));
    act(() => {
      result.current.setPage(1);
    });
    expect(result.current.page).toBe(1);

    act(() => {
      result.current.setBusca("Tech 1");
    });
    expect(result.current.page).toBe(0);
  });

  it("reseta página ao mudar filtro de estado ou status", () => {
    const { result } = renderHook(() => useTecnicosTableState(makeList(5)));
    act(() => {
      result.current.setPage(1);
    });
    act(() => {
      result.current.setFiltroEstado("RJ");
    });
    expect(result.current.page).toBe(0);

    act(() => {
      result.current.setPage(1);
    });
    act(() => {
      result.current.setFiltroStatus("inativo");
    });
    expect(result.current.page).toBe(0);
  });

  it("edge: lista vazia mantém totalPages 1", () => {
    const { result } = renderHook(() => useTecnicosTableState([]));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginated).toEqual([]);
  });
});
