import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClienteModal } from "@/pages/clientes/cliente-modal/useClienteModal";
import {
  CLIENTES_LISTA_QUERY_KEY,
  CLIENTES_QUERY_KEY,
} from "@/pages/clientes/hooks/useClientesPageList";
import type { Cliente } from "@/pages/clientes/shared/clientes-page.shared";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: apiMock,
}));

vi.mock("@/hooks/useBrasilAPI", () => ({
  useUFs: () => ({ data: [] }),
  useMunicipios: () => ({ data: [] }),
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return { Wrapper, qc };
}

function clienteFixture(over: Partial<Cliente> = {}): Cliente {
  return {
    id: 7,
    nome: "Empresa X",
    nomeFantasia: "FX",
    cnpj: "12345678000199",
    tipoContrato: "AQUISICAO",
    status: "PENDENTE",
    cep: "01310100",
    logradouro: "Rua 1",
    numero: "10",
    complemento: null,
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
    contatos: [
      { id: 1, nome: "João", celular: "11999999999", email: "a@b.co" },
    ],
    ...over,
  };
}

describe("useClienteModal", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("modo criação: valores padrão ao abrir", async () => {
    const onClose = vi.fn();
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useClienteModal({
          open: true,
          editingCliente: null,
          onClose,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(result.current.form.getValues("nome")).toBe("");
      expect(result.current.form.getValues("tipoContrato")).toBe("COMODATO");
      expect(result.current.form.getValues("contatos")).toEqual([]);
    });
  });

  it("modo edição: preenche formulário com cliente", async () => {
    const c = clienteFixture();
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useClienteModal({
          open: true,
          editingCliente: c,
          onClose: vi.fn(),
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(result.current.form.getValues("nome")).toBe("Empresa X");
      expect(result.current.form.getValues("tipoContrato")).toBe("AQUISICAO");
      expect(result.current.form.getValues("contatos")).toHaveLength(1);
    });
  });

  it("addContato adiciona linha vazia", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useClienteModal({
          open: true,
          editingCliente: null,
          onClose: vi.fn(),
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.fields.length).toBe(0));
    act(() => {
      result.current.addContato();
    });
    expect(result.current.fields.length).toBe(1);
  });

  it("create: chama POST e invalida clientes + clientes-lista", async () => {
    apiMock.mockResolvedValue({});
    const onClose = vi.fn();
    const { Wrapper, qc } = createWrapper();
    void qc.prefetchQuery({ queryKey: CLIENTES_QUERY_KEY, queryFn: () => [] });
    void qc.prefetchQuery({
      queryKey: CLIENTES_LISTA_QUERY_KEY,
      queryFn: () => [],
    });

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useClienteModal({
          open: true,
          editingCliente: null,
          onClose,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.form.getValues("nome")).toBe(""));

    act(() => {
      result.current.form.setValue("nome", "Nova Razão");
    });

    await act(async () => {
      await result.current.handleSubmit(result.current.form.getValues());
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(apiMock).toHaveBeenCalledWith(
      "/clientes",
      expect.objectContaining({ method: "POST" }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CLIENTES_QUERY_KEY,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: CLIENTES_LISTA_QUERY_KEY,
    });
  });

  it("update: chama PATCH com id do cliente", async () => {
    apiMock.mockResolvedValue({});
    const c = clienteFixture({ id: 42 });
    const onClose = vi.fn();
    const { Wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useClienteModal({
          open: true,
          editingCliente: c,
          onClose,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current.form.getValues("nome")).toBe("Empresa X"),
    );

    await act(async () => {
      await result.current.handleSubmit(result.current.form.getValues());
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(apiMock).toHaveBeenCalledWith(
      "/clientes/42",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
