import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useCriarOrdemServicoMutation } from "@/pages/ordens-servico/criacao/hooks/useCriarOrdemServicoMutation";
import { toast } from "sonner";

const api = vi.hoisted(() => vi.fn());
const navigate = vi.hoisted(() => vi.fn());
const invalidateQueries = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries }),
  };
});

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  api.mockReset();
  navigate.mockReset();
  invalidateQueries.mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe("useCriarOrdemServicoMutation", () => {
  it("em sucesso invalida ordens, navega e toast com número", async () => {
    api.mockResolvedValue({ id: 1, numero: 44 });
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCriarOrdemServicoMutation(), {
      wrapper: wrapper(qc),
    });
    result.current.mutate({
      tipo: "REVISAO",
      clienteId: 1,
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Ordem de serviço #44 criada");
    });
    expect(navigate).toHaveBeenCalledWith("/");
    expect(invalidateQueries).toHaveBeenCalled();
  });

  it("com subclienteUpdate invalida clientes", async () => {
    api.mockResolvedValue({ id: 1, numero: 1 });
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCriarOrdemServicoMutation(), {
      wrapper: wrapper(qc),
    });
    result.current.mutate({
      tipo: "REVISAO",
      clienteId: 1,
      subclienteUpdate: {
        nome: "A",
        cep: "0",
        cidade: "C",
        estado: "S",
        telefone: "0",
      },
    });
    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["clientes"],
      });
    });
  });

  it("erro: toast de falha", async () => {
    api.mockRejectedValue(new Error("x"));
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const { result } = renderHook(() => useCriarOrdemServicoMutation(), {
      wrapper: wrapper(qc),
    });
    result.current.mutate({ tipo: "REVISAO", clienteId: 1 });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("x");
    });
  });
});
