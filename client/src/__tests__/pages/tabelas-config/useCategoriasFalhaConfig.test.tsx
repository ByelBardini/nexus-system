import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCategoriasFalhaConfig } from "@/pages/tabelas-config/categorias-falha/useCategoriasFalhaConfig";
import type { CategoriaFalha } from "@/pages/tabelas-config/categorias-falha/useCategoriasFalhaConfig";

const api = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({ api: (...a: unknown[]) => api(...a) }));
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

const catBase: CategoriaFalha = {
  id: 1,
  nome: "Dano Físico",
  ativo: true,
  motivaTexto: false,
  criadoEm: "2026-01-01T00:00:00.000Z",
};

function makeQC() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  api.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
});

describe("useCategoriasFalhaConfig", () => {
  describe("query", () => {
    it("retorna categorias da API e isLoading false após resolução", async () => {
      api.mockResolvedValue([catBase]);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.categorias).toEqual([catBase]);
      expect(api).toHaveBeenCalledWith("/tabelas-config/categorias-falha");
    });

    it("retorna array vazio enquanto a query ainda não resolveu", () => {
      api.mockReturnValue(new Promise(() => {}));
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      expect(result.current.categorias).toEqual([]);
    });
  });

  describe("estado do modal", () => {
    it("começa fechado", () => {
      api.mockResolvedValue([]);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      expect(result.current.modal.open).toBe(false);
    });

    it("abrirCriar → modal aberto no modo criar", () => {
      api.mockResolvedValue([]);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.abrirCriar());

      expect(result.current.modal).toEqual({ open: true, modo: "criar" });
    });

    it("abrirEditar → modal aberto no modo editar com o item correto", () => {
      api.mockResolvedValue([]);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.abrirEditar(catBase));

      expect(result.current.modal).toEqual({
        open: true,
        modo: "editar",
        item: catBase,
      });
    });

    it("fecharModal → modal volta a fechado", () => {
      api.mockResolvedValue([]);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.abrirCriar());
      act(() => result.current.fecharModal());

      expect(result.current.modal.open).toBe(false);
    });
  });

  describe("criarMutation", () => {
    it("sucesso: POST correto, invalida queries e fecha modal", async () => {
      api
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({})
        .mockResolvedValue([]);
      const qc = makeQC();
      const inv = vi.spyOn(qc, "invalidateQueries");
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.abrirCriar());
      act(() =>
        result.current.criarMutation.mutate({
          nome: "Nova",
          motivaTexto: true,
        }),
      );

      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith(
          "Categoria criada com sucesso!",
        ),
      );

      const postCall = api.mock.calls.find(
        (c) =>
          c[0] === "/tabelas-config/categorias-falha" &&
          c[1]?.method === "POST",
      );
      expect(postCall).toBeDefined();
      expect(JSON.parse(postCall![1].body)).toEqual({
        nome: "Nova",
        motivaTexto: true,
      });
      expect(inv).toHaveBeenCalledWith({
        queryKey: ["tabelas-config", "categorias-falha"],
      });
      expect(inv).toHaveBeenCalledWith({
        queryKey: ["tabelas-config", "categorias-falha", "ativas"],
      });
      expect(result.current.modal.open).toBe(false);
    });

    it("erro: exibe toast de erro e não fecha modal", async () => {
      api
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error("nome duplicado"));
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.abrirCriar());
      act(() =>
        result.current.criarMutation.mutate({
          nome: "Dup",
          motivaTexto: false,
        }),
      );

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("nome duplicado"),
      );
      expect(result.current.modal.open).toBe(true);
    });
  });

  describe("atualizarMutation", () => {
    it("sucesso: PATCH no endpoint correto, invalida queries e fecha modal", async () => {
      api
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({})
        .mockResolvedValue([]);
      const qc = makeQC();
      const inv = vi.spyOn(qc, "invalidateQueries");
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.abrirEditar(catBase));
      act(() =>
        result.current.atualizarMutation.mutate({
          id: 1,
          dto: { nome: "Atualizado" },
        }),
      );

      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith("Categoria atualizada!"),
      );

      const patchCall = api.mock.calls.find(
        (c) =>
          c[0] === "/tabelas-config/categorias-falha/1" &&
          c[1]?.method === "PATCH",
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall![1].body)).toEqual({ nome: "Atualizado" });
      expect(inv).toHaveBeenCalledWith({
        queryKey: ["tabelas-config", "categorias-falha"],
      });
      expect(result.current.modal.open).toBe(false);
    });
  });

  describe("search e categoriasFiltradas", () => {
    it("searchCategoria começa vazio e categoriasFiltradas retorna tudo", async () => {
      const cats = [catBase, { ...catBase, id: 2, nome: "Outro" }];
      api.mockResolvedValue(cats);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.searchCategoria).toBe("");
      expect(result.current.categoriasFiltradas).toEqual(cats);
    });

    it("setSearchCategoria filtra pelo nome (case-insensitive)", async () => {
      const cats = [catBase, { ...catBase, id: 2, nome: "Outro" }];
      api.mockResolvedValue(cats);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.setSearchCategoria("DANO"));
      expect(result.current.categoriasFiltradas).toEqual([catBase]);
    });

    it("filtra ignorando acentos", async () => {
      const cats = [
        { ...catBase, nome: "Dano Físico" },
        { ...catBase, id: 2, nome: "Outro" },
      ];
      api.mockResolvedValue(cats);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.setSearchCategoria("fisico"));
      expect(result.current.categoriasFiltradas).toHaveLength(1);
      expect(result.current.categoriasFiltradas[0]!.nome).toBe("Dano Físico");
    });

    it("busca vazia retorna todas as categorias", async () => {
      const cats = [catBase, { ...catBase, id: 2, nome: "Outro" }];
      api.mockResolvedValue(cats);
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.setSearchCategoria("xyz"));
      expect(result.current.categoriasFiltradas).toHaveLength(0);
      act(() => result.current.setSearchCategoria(""));
      expect(result.current.categoriasFiltradas).toEqual(cats);
    });
  });

  describe("desativarMutation", () => {
    it("sucesso: DELETE no endpoint correto e invalida queries", async () => {
      api
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({})
        .mockResolvedValue([]);
      const qc = makeQC();
      const inv = vi.spyOn(qc, "invalidateQueries");
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.desativarMutation.mutate(1));

      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith("Categoria desativada!"),
      );

      const deleteCall = api.mock.calls.find(
        (c) =>
          c[0] === "/tabelas-config/categorias-falha/1" &&
          c[1]?.method === "DELETE",
      );
      expect(deleteCall).toBeDefined();
      expect(inv).toHaveBeenCalledWith({
        queryKey: ["tabelas-config", "categorias-falha"],
      });
      expect(inv).toHaveBeenCalledWith({
        queryKey: ["tabelas-config", "categorias-falha", "ativas"],
      });
    });

    it("erro: exibe toast de erro com mensagem da exceção", async () => {
      api
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error("não encontrado"));
      const qc = makeQC();
      const { result } = renderHook(() => useCategoriasFalhaConfig(), {
        wrapper: wrapper(qc),
      });

      act(() => result.current.desativarMutation.mutate(99));

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("não encontrado"),
      );
    });
  });
});
