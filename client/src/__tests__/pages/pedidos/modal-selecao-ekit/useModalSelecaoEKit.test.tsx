import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useModalSelecaoEKit } from "@/pages/pedidos/modal-selecao-ekit/hooks/useModalSelecaoEKit";
import { buildKitDetalhe } from "./modal-selecao-ekit.fixtures";
import { buildPedidoApiMisto, buildPedidoView } from "./modal-selecao-ekit.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapperFor(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

function pedidoApiCliente() {
  return {
    id: 10,
    codigo: "PED-001",
    tipoDestino: "CLIENTE" as const,
    tecnicoId: null,
    clienteId: 1,
    subclienteId: null,
    quantidade: 5,
    status: "EM_CONFIGURACAO" as const,
    urgencia: "MEDIA" as const,
    observacao: null,
    criadoPorId: 1,
    criadoEm: "",
    atualizadoEm: "",
    entregueEm: null,
    cliente: { id: 1, nome: "C" },
  };
}

describe("useModalSelecaoEKit", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("não busca kits/detalhes quando o modal está fechado", async () => {
    apiMock.mockResolvedValue([]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(
      () =>
        useModalSelecaoEKit({
          open: false,
          onOpenChange: vi.fn(),
          pedido: buildPedidoView(),
          pedidoApi: pedidoApiCliente(),
          onVincular: vi.fn(),
        }),
      { wrapper: wrapperFor(qc) },
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(
      apiMock.mock.calls.some(
        (c) => c[0] === "/aparelhos/pareamento/kits/detalhes",
      ),
    ).toBe(false);
  });

  it("com modal aberto na seleção busca kits/detalhes", async () => {
    apiMock.mockResolvedValue([buildKitDetalhe()]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(
      () =>
        useModalSelecaoEKit({
          open: true,
          onOpenChange: vi.fn(),
          pedido: buildPedidoView(),
          pedidoApi: pedidoApiCliente(),
          onVincular: vi.fn(),
        }),
      { wrapper: wrapperFor(qc) },
    );

    await waitFor(() =>
      expect(
        apiMock.mock.calls.some(
          (c) => c[0] === "/aparelhos/pareamento/kits/detalhes",
        ),
      ).toBe(true),
    );
  });

  it("isMisto reflete tipoDestino MISTO na API", () => {
    apiMock.mockResolvedValue([]);
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(
      () =>
        useModalSelecaoEKit({
          open: true,
          onOpenChange: vi.fn(),
          pedido: buildPedidoView({ tipo: "misto" }),
          pedidoApi: buildPedidoApiMisto(),
          onVincular: vi.fn(),
          kitParaEditar: { id: 1, nome: "K" },
        }),
      { wrapper: wrapperFor(qc) },
    );

    expect(result.current.isMisto).toBe(true);
  });
});
