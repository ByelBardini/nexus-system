import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useModalSelecaoEKit } from "@/pages/pedidos/modal-selecao-ekit/hooks/useModalSelecaoEKit";
import type { PedidoRastreadorApi, PedidoRastreadorView } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { buildPedidoView } from "@/__tests__/pages/pedidos/modal-selecao-ekit/modal-selecao-ekit.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function withQc(n: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{n}</QueryClientProvider>;
}

function View({
  pView,
  pApi,
  open,
}: {
  pView: PedidoRastreadorView;
  pApi: PedidoRastreadorApi;
  open: boolean;
}) {
  useModalSelecaoEKit({
    open,
    onOpenChange: () => {},
    pedido: pView,
    pedidoApi: pApi,
    onVincular: () => {},
    kitsPorPedido: {},
    kitParaEditar: { id: 9, nome: "Kit" },
  });
  return <div>hook</div>;
}

/**
 * Fumaça: hook usa useKitComAparelhosQuery (vê chamada a GET kit quando em edição).
 */
describe("useModalSelecaoEKit + useKitComAparelhosQuery", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockImplementation((p: string) => {
      if (p.startsWith("/aparelhos/pareamento/kits/detalhes")) {
        return Promise.resolve([]);
      }
      if (p.startsWith("/aparelhos/pareamento/kits/")) {
        return Promise.resolve({
          id: 1,
          nome: "K",
          criadoEm: "",
          aparelhos: [],
        });
      }
      if (p.includes("aparelhos-destinatarios")) {
        return Promise.resolve({ assignments: [], quotaUsage: [] });
      }
      if (p.includes("aparelhos-disponiveis")) {
        return Promise.resolve([]);
      }
      return Promise.resolve(null);
    });
  });

  it("edicao + kit selecionado: api de kit com aparelhos é chamada", async () => {
    const pView = buildPedidoView();
    const pApi: PedidoRastreadorApi = {
      id: pView.id,
      codigo: pView.codigo,
      tipoDestino: "TECNICO",
      tecnicoId: 1,
      clienteId: null,
      subclienteId: null,
      quantidade: 1,
      status: "EM_CONFIGURACAO",
      urgencia: "MEDIA",
      observacao: null,
      criadoPorId: 1,
      criadoEm: "",
      atualizadoEm: "",
      entregueEm: null,
    };
    render(
      withQc(
        <View
          pView={pView}
          pApi={pApi}
          open
        />,
      ),
    );
    await waitFor(
      () => {
        const hit = apiMock.mock.calls
          .map((c) => String(c[0]))
          .find(
            (u) =>
              u === "/aparelhos/pareamento/kits/9" ||
              u.startsWith("/aparelhos/pareamento/kits/9?"),
          );
        expect(hit).toBeDefined();
      },
      { timeout: 3000 },
    );
  });
});
