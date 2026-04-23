import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TipoDespacho } from "@/pages/pedidos/shared/pedidos-config-types";
import { SidePanel } from "@/pages/pedidos/side-panel/SidePanel";
import { buildAparelhoNoKit, buildKitComAparelhos, buildPedidoView } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";
import { URGENCIA_STYLE } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { toast } from "sonner";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} aria-hidden />
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

vi.mock("@/pages/pedidos/modal-selecao-ekit/ModalSelecaoEKit", () => ({
  ModalSelecaoEKit: () => <div data-testid="modal-selecao-ekit-stub" />,
}));

function TestApp({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function DespachoEmMaosCenario() {
  const [tipoDespacho, setTipoDespacho] = useState<TipoDespacho>("TRANSPORTADORA");
  return (
    <TestApp>
      <SidePanel
        pedido={buildPedidoView({ quantidade: 5, status: "em_configuracao" })}
        pedidoApi={pedidoApi()}
        open
        onClose={vi.fn()}
        onStatusUpdated={vi.fn()}
        kitsVinculados={[{ id: 1, nome: "K", quantidade: 5 }]}
        onKitsChange={vi.fn()}
        tipoDespacho={tipoDespacho}
        onTipoDespachoChange={setTipoDespacho}
        kitsPorPedido={{}}
        transportadora="X"
        numeroNf="1"
        onTransportadoraChange={vi.fn()}
        onNumeroNfChange={vi.fn()}
      />
    </TestApp>
  );
}

function pedidoApi() {
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
    kitIds: [1],
    cliente: { id: 1, nome: "C" },
  };
}

describe("SidePanel (integração)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("mostra badge de urgência com classes do URGENCIA_STYLE (Alta)", () => {
    const pedido = buildPedidoView({ urgencia: "Alta" });
    render(
      <TestApp>
        <SidePanel
          pedido={pedido}
          pedidoApi={pedidoApi()}
          open
          onClose={vi.fn()}
          onStatusUpdated={vi.fn()}
          kitsVinculados={[]}
          onKitsChange={vi.fn()}
          tipoDespacho="TRANSPORTADORA"
          onTipoDespachoChange={vi.fn()}
          kitsPorPedido={{}}
          transportadora=""
          numeroNf=""
          onTransportadoraChange={vi.fn()}
          onNumeroNfChange={vi.fn()}
        />
      </TestApp>,
    );
    const badge = screen.getByText("Alta");
    expect(badge.className).toMatch(/rounded/);
    for (const cls of URGENCIA_STYLE.Alta.badge.split(/\s+/)) {
      if (cls) expect(badge).toHaveClass(cls);
    }
  });

  it("não chama api de kit com painel fechado (open false)", async () => {
    apiMock.mockResolvedValue(buildKitComAparelhos());
    render(
      <TestApp>
        <SidePanel
          pedido={buildPedidoView()}
          pedidoApi={pedidoApi()}
          open={false}
          onClose={vi.fn()}
          onStatusUpdated={vi.fn()}
          kitsVinculados={[{ id: 1, nome: "K", quantidade: 5 }]}
          onKitsChange={vi.fn()}
          tipoDespacho="TRANSPORTADORA"
          onTipoDespachoChange={vi.fn()}
          kitsPorPedido={{}}
          transportadora=""
          numeroNf=""
          onTransportadoraChange={vi.fn()}
          onNumeroNfChange={vi.fn()}
        />
      </TestApp>,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(
      apiMock.mock.calls.some(
        (c) =>
          typeof c[0] === "string" && c[0].includes("/aparelhos/pareamento/kits/"),
      ),
    ).toBe(false);
  });

  it("expande kit, busca detalhe e exibe resumo; Avançar envia status", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation(
      async (path: string, init?: { method?: string }) => {
        if (path === "/aparelhos/pareamento/kits/1") {
          return buildKitComAparelhos({
            id: 1,
            aparelhos: [
              buildAparelhoNoKit({
                marca: "M",
                modelo: "X",
                operadora: "Vivo",
              }),
            ],
          });
        }
        if (path === "/pedidos-rastreadores/10/status" && init?.method === "PATCH") {
          return {};
        }
        return {};
      },
    );
    const onStatus = vi.fn();
    render(
      <TestApp>
        <SidePanel
          pedido={buildPedidoView({ id: 10, quantidade: 5, status: "em_configuracao" })}
          pedidoApi={pedidoApi()}
          open
          onClose={vi.fn()}
          onStatusUpdated={onStatus}
          kitsVinculados={[{ id: 1, nome: "K1", quantidade: 5 }]}
          onKitsChange={vi.fn()}
          tipoDespacho="TRANSPORTADORA"
          onTipoDespachoChange={vi.fn()}
          kitsPorPedido={{}}
          transportadora=""
          numeroNf=""
          onTransportadoraChange={vi.fn()}
          onNumeroNfChange={vi.fn()}
        />
      </TestApp>,
    );
    const expandIcon = screen.getByTestId("icon-expand_more");
    const expandBtn = expandIcon.closest("button");
    expect(expandBtn).toBeTruthy();
    await user.click(expandBtn!);
    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith("/aparelhos/pareamento/kits/1"),
    );
    expect(await screen.findByText("Marcas / Modelos")).toBeInTheDocument();
    const av = screen.getByRole("button", { name: /avançar/i });
    await user.click(av);
    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/pedidos-rastreadores\/10\/status/),
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    expect(onStatus).toHaveBeenCalled();
  });

  it("despacho: troca para Em Mãos e esconde campos de transporte", async () => {
    const user = userEvent.setup();
    render(<DespachoEmMaosCenario />);
    expect(screen.getByPlaceholderText("Ex: Braspress")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /em mãos/i }));
    expect(screen.queryByPlaceholderText("Ex: Braspress")).toBeNull();
  });
});
