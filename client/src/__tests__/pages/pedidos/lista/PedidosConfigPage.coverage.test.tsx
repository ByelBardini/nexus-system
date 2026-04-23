import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PedidosConfigPage } from "@/pages/pedidos/PedidosConfigPage";
import type { KitVinculado, TipoDespacho } from "@/pages/pedidos/shared/pedidos-config-types";
import type { PedidoRastreadorApi } from "@/types/pedidos-rastreador";

const apiMock = vi.hoisted(() => vi.fn());

const STORAGE_KEY = "nexus-pedidos-config-workspace";

type Persisted = {
  kitsPorPedido: Record<string, unknown[]>;
  tipoDespachoPorPedido: Record<string, string>;
  transportadoraPorPedido: Record<string, string>;
  numeroNfPorPedido: Record<string, string | null | unknown>;
};

function readPersisted(): Persisted {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  expect(raw).toBeTruthy();
  return JSON.parse(String(raw)) as Persisted;
}

function makeTecnicoEmConfig(over: Partial<PedidoRastreadorApi> = {}): PedidoRastreadorApi {
  return {
    id: 99,
    codigo: "PED-COV-1",
    tipoDestino: "TECNICO",
    tecnicoId: 1,
    clienteId: null,
    subclienteId: null,
    quantidade: 2,
    status: "EM_CONFIGURACAO",
    urgencia: "MEDIA",
    observacao: null,
    criadoPorId: 1,
    dataSolicitacao: "2024-06-10T00:00:00.000Z",
    criadoEm: "2024-06-10T00:00:00.000Z",
    atualizadoEm: "2024-06-10T00:00:00.000Z",
    entregueEm: null,
    tecnico: { id: 1, nome: "Técnico X" },
    kitIds: [1],
    ...over,
  };
}

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: () => true, user: { nome: "U" } }),
}));

/** Painel falso: expõe kits recebidos para asserções de hidratação sem acoplar ao SidePanel real. */
vi.mock("@/pages/pedidos/side-panel/SidePanel", () => ({
  SidePanel: (props: Record<string, unknown>) => {
    const pedido = props.pedido as { id: number; codigo: string } | null;
    if (!pedido) return <div data-testid="side-panel" />;
    const kits = (props.kitsVinculados ?? []) as KitVinculado[];
    return (
      <div
        data-testid="side-panel"
        data-pedido-id={pedido.id}
        data-kits-json={JSON.stringify(kits)}
        data-tipo-despacho={String(
          (props as { tipoDespacho?: TipoDespacho }).tipoDespacho ?? "",
        )}
      >
        <button
          type="button"
          data-testid="sp-set-kits"
          onClick={() =>
            (props.onKitsChange as (k: KitVinculado[]) => void)([
              { id: 1, nome: "A", quantidade: 1 },
            ])
          }
        >
          set-kits
        </button>
        <button
          type="button"
          data-testid="sp-tipo"
          onClick={() =>
            (props.onTipoDespachoChange as (t: TipoDespacho) => void)(
              "CORREIOS",
            )
          }
        >
          tipo
        </button>
        <button
          type="button"
          data-testid="sp-transp"
          onClick={() =>
            (props.onTransportadoraChange as (v: string) => void)("Jadlog")
          }
        >
          transp
        </button>
        <button
          type="button"
          data-testid="sp-nf"
          onClick={() => (props.onNumeroNfChange as (v: string) => void)("123")}
        >
          nf
        </button>
        <button
          type="button"
          data-testid="sp-close"
          onClick={() => (props.onClose as () => void)()}
        >
          close
        </button>
      </div>
    );
  },
}));

function App({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function kitsDetalhesCallCount(): number {
  return apiMock.mock.calls
    .map((c) => String(c[0]))
    .filter((p) => p.includes("kits") && p.includes("detalhes")).length;
}

describe("PedidosConfigPage — storage, hidratação e integração com lista", () => {
  beforeEach(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    apiMock.mockReset();
    apiMock.mockImplementation((path: string) => {
      if (String(path).includes("pedidos-rastreadores")) {
        return Promise.resolve({ data: [makeTecnicoEmConfig()] });
      }
      if (String(path).includes("kits/detalhes")) {
        return Promise.resolve([
          { id: 1, nome: "Kit API", quantidade: 2 },
        ] as { id: number; nome: string; quantidade: number }[]);
      }
      return Promise.resolve(null);
    });
  });

  it("JSON inválido no sessionStorage: não quebra; persiste mapa vazio e estrutura completa", async () => {
    sessionStorage.setItem(STORAGE_KEY, "{não é json");
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    await waitFor(() => {
      const p = readPersisted();
      expect(p.kitsPorPedido).toEqual({});
      expect(p.tipoDespachoPorPedido).toEqual({});
      expect(p.transportadoraPorPedido).toEqual({});
      expect(p.numeroNfPorPedido).toEqual({});
    });
  });

  it("reidratação ignora chaves inválidas e conserva somente pares type-safe (kits, despes, NF)", async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        kitsPorPedido: {
          5: "invalid",
          6: [
            { id: 1, nome: "OK", quantidade: 1 },
            { id: 2, nome: 3, quantidade: 1 },
          ],
        },
        tipoDespachoPorPedido: { 1: "INVALID", 2: "EM_MAOS" },
        transportadoraPorPedido: { 3: 999, 4: "Rodo" },
        numeroNfPorPedido: { 5: null, 6: "NF-1" },
      }),
    );
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    await waitFor(() => {
      const p = readPersisted();
      expect("5" in p.kitsPorPedido).toBe(false);
      expect("6" in p.kitsPorPedido).toBe(false);
      expect(p.tipoDespachoPorPedido["1"]).toBeUndefined();
      expect(p.tipoDespachoPorPedido["2"]).toBe("EM_MAOS");
      expect("3" in p.transportadoraPorPedido).toBe(false);
      expect(p.transportadoraPorPedido["4"]).toBe("Rodo");
      expect("5" in p.numeroNfPorPedido).toBe(false);
      expect(p.numeroNfPorPedido["6"]).toBe("NF-1");
    });
  });

  it("com kitIds vazios: abre o painel mas não busca /kits/detalhes (query desligada)", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((path: string) => {
      if (String(path).includes("pedidos-rastreadores")) {
        return Promise.resolve({ data: [makeTecnicoEmConfig({ kitIds: [] })] });
      }
      if (String(path).includes("kits/detalhes")) {
        return Promise.resolve([{ id: 1, nome: "Não deve carregar", quantidade: 1 }]);
      }
      return Promise.resolve(null);
    });
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    const card = await screen.findByRole("button", { name: /PED-COV-1/ });
    await user.click(card);
    await waitFor(() => expect(screen.getByTestId("side-panel")).toHaveAttribute("data-pedido-id", "99"));
    expect(kitsDetalhesCallCount()).toBe(0);
    expect(screen.getByTestId("side-panel")).toHaveAttribute("data-kits-json", "[]");
  });

  it("hidrata kits do backend quando ainda não havia nada no workspace: nome e qtd vêm de GET detalhes", async () => {
    const user = userEvent.setup();
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    const card = await screen.findByRole("button", { name: /PED-COV-1/ });
    await user.click(card);
    await waitFor(() => expect(kitsDetalhesCallCount()).toBeGreaterThan(0));
    const panel = await waitFor(
      () => screen.getByTestId("side-panel") as HTMLElement,
    );
    const kits = JSON.parse(panel.getAttribute("data-kits-json") || "[]") as Array<{
      id: number;
      nome: string;
      quantidade: number;
    }>;
    expect(kits).toEqual([{ id: 1, nome: "Kit API", quantidade: 2 }]);
    const progresso = within(card).getByText(/02\s*\/\s*02/);
    expect(progresso).toBeInTheDocument();
  });

  it("não substitui kits já persistidos no workspace (usuário manteve seleção local)", async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        kitsPorPedido: {
          99: [{ id: 1, nome: "Kits Salvo Local", quantidade: 1 }],
        },
        tipoDespachoPorPedido: {},
        transportadoraPorPedido: {},
        numeroNfPorPedido: {},
      }),
    );
    const user = userEvent.setup();
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    const card = await screen.findByRole("button", { name: /PED-COV-1/ });
    await user.click(card);
    await waitFor(
      () => {
        const panel = screen.getByTestId("side-panel");
        const k = panel.getAttribute("data-kits-json");
        expect(k).toContain("Kits Salvo Local");
        expect(k).not.toContain("Kit API");
      },
      { timeout: 3000 },
    );
  });

  it("kitIds parcial no GET: id ausente em detalhes cai no fallback `Kit #id` e qtd 1; ids presentes usam a API", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((path: string) => {
      if (String(path).includes("pedidos-rastreadores")) {
        return Promise.resolve({
          data: [makeTecnicoEmConfig({ kitIds: [1, 99] })],
        });
      }
      if (String(path).includes("kits/detalhes")) {
        return Promise.resolve([{ id: 1, nome: "Só 1", quantidade: 2 }]);
      }
      return Promise.resolve(null);
    });
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    await user.click(await screen.findByRole("button", { name: /PED-COV-1/ }));
    await waitFor(() => {
      const k = JSON.parse(
        screen.getByTestId("side-panel").getAttribute("data-kits-json") || "[]",
      ) as { id: number; nome: string; quantidade: number }[];
      expect(k).toEqual([
        { id: 1, nome: "Só 1", quantidade: 2 },
        { id: 99, nome: "Kit #99", quantidade: 1 },
      ]);
    });
  });

  it("clique no card + ajustes no painel persistem tipo, transportadora e NF (contrato de storage)", async () => {
    const user = userEvent.setup();
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    await user.click(await screen.findByRole("button", { name: /PED-COV-1/ }));
    await waitFor(() => expect(screen.getByTestId("sp-set-kits")).toBeInTheDocument());
    await user.click(screen.getByTestId("sp-set-kits"));
    await user.click(screen.getByTestId("sp-tipo"));
    await user.click(screen.getByTestId("sp-transp"));
    await user.click(screen.getByTestId("sp-nf"));
    await user.click(screen.getByTestId("sp-close"));
    const p = readPersisted();
    expect(p.tipoDespachoPorPedido["99"]).toBe("CORREIOS");
    expect(p.transportadoraPorPedido["99"]).toBe("Jadlog");
    expect(p.numeroNfPorPedido["99"]).toBe("123");
  });

  it("enquanto a lista busca, mostra loading; após resolução, exibe a toolbar de busca", async () => {
    let release!: (v: { data: PedidoRastreadorApi[] }) => void;
    const pending = new Promise<{ data: PedidoRastreadorApi[] }>((r) => {
      release = r;
    });
    apiMock.mockImplementation((path: string) => {
      if (String(path).includes("pedidos-rastreadores")) return pending;
      return Promise.resolve([]);
    });
    render(
      <App>
        <PedidosConfigPage />
      </App>,
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("pedidos-rastreadores-busca")).not.toBeInTheDocument();
    await act(async () => {
      release({ data: [] });
    });
    await waitFor(() => {
      expect(screen.getByTestId("pedidos-rastreadores-busca")).toBeInTheDocument();
    });
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
  });
});
