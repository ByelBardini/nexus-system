import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ModalSelecaoEKit } from "@/pages/pedidos/modal-selecao-ekit/ModalSelecaoEKit";
import type { PedidoRastreadorApi } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import {
  buildAparelhoNoKit,
  buildKitComAparelhos,
  buildKitDetalhe,
  buildPedidoApiMisto,
  buildPedidoView,
} from "./modal-selecao-ekit.fixtures";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} aria-hidden />
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function TestApp({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function pedidoApiCliente(): PedidoRastreadorApi {
  return {
    id: 10,
    codigo: "PED-001",
    tipoDestino: "CLIENTE",
    tecnicoId: null,
    clienteId: 1,
    subclienteId: null,
    quantidade: 5,
    status: "EM_CONFIGURACAO",
    urgencia: "MEDIA",
    observacao: null,
    criadoPorId: 1,
    criadoEm: "",
    atualizadoEm: "",
    entregueEm: null,
    cliente: { id: 1, nome: "Cliente Único" },
  };
}

function setupApiRouter() {
  apiMock.mockImplementation(async (path: string, init?: RequestInit) => {
    if (path === "/aparelhos/pareamento/kits/detalhes") {
      return [
        buildKitDetalhe({ id: 1, nome: "KIT-ALPHA" }),
        buildKitDetalhe({ id: 2, nome: "OUTRO", modelosOperadoras: "escondido" }),
      ];
    }
    if (path === "/aparelhos/pareamento/kits/1") {
      return buildKitComAparelhos({
        id: 1,
        nome: "KIT-ALPHA",
        aparelhos: [
          buildAparelhoNoKit({
            id: 50,
            identificador: "NO-KIT",
            kit: { id: 1, nome: "KIT-ALPHA" },
          }),
        ],
      });
    }
    if (path.startsWith("/aparelhos/pareamento/aparelhos-disponiveis")) {
      return [
        buildAparelhoNoKit({
          id: 200,
          identificador: "DISP-1",
          marca: "M",
          modelo: "X",
        }),
      ];
    }
    if (
      path === "/aparelhos/pareamento/aparelho/200/kit" &&
      init?.method === "PATCH"
    ) {
      return {};
    }
    if (path === "/aparelhos/pareamento/kits" && init?.method === "POST") {
      return { id: 99, nome: "KIT-NOVO" };
    }
    throw new Error(`unexpected api call: ${path} ${init?.method ?? "GET"}`);
  });
}

describe("ModalSelecaoEKit (integração ponta a ponta)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("abre na seleção, filtra kits por texto e entra em edição ao escolher", async () => {
    setupApiRouter();
    const user = userEvent.setup();
    const onVincular = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TestApp>
        <ModalSelecaoEKit
          open
          onOpenChange={onOpenChange}
          pedido={buildPedidoView()}
          pedidoApi={pedidoApiCliente()}
          onVincular={onVincular}
        />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByRole("cell", { name: "KIT-ALPHA" })).toBeInTheDocument(),
    );

    await user.type(
      screen.getByPlaceholderText(/Filtrar por nome ou modelos/i),
      "ALPHA",
    );
    expect(screen.queryByRole("cell", { name: "OUTRO" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Escolher/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Editar Kit — KIT-ALPHA/i }),
      ).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByText("DISP-1")).toBeInTheDocument(),
    );
  });

  it("Cancelar na seleção chama onOpenChange(false) e não vincula", async () => {
    setupApiRouter();
    const user = userEvent.setup();
    const onVincular = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TestApp>
        <ModalSelecaoEKit
          open
          onOpenChange={onOpenChange}
          pedido={buildPedidoView()}
          pedidoApi={pedidoApiCliente()}
          onVincular={onVincular}
        />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByRole("cell", { name: "KIT-ALPHA" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onVincular).not.toHaveBeenCalled();
  });

  it("criar kit POST e avança para edição com nome retornado", async () => {
    apiMock.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === "/aparelhos/pareamento/kits/detalhes") return [];
      if (path === "/aparelhos/pareamento/kits" && init?.method === "POST") {
        return { id: 99, nome: "KIT-NOVO" };
      }
      if (path === "/aparelhos/pareamento/kits/99") {
        return buildKitComAparelhos({ id: 99, nome: "KIT-NOVO", aparelhos: [] });
      }
      if (path.startsWith("/aparelhos/pareamento/aparelhos-disponiveis")) {
        return [];
      }
      throw new Error(path);
    });

    const user = userEvent.setup();
    render(
      <TestApp>
        <ModalSelecaoEKit
          open
          onOpenChange={vi.fn()}
          pedido={buildPedidoView()}
          pedidoApi={pedidoApiCliente()}
          onVincular={vi.fn()}
        />
      </TestApp>,
    );

    await user.click(screen.getByRole("button", { name: /Criar Novo Kit/i }));
    await user.type(
      screen.getByPlaceholderText(/Nome do novo kit/i),
      "KIT-NOVO",
    );
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Editar Kit — KIT-NOVO/i }),
      ).toBeInTheDocument(),
    );
    expect(apiMock).toHaveBeenCalledWith(
      "/aparelhos/pareamento/kits",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("MISTO: Adicionar ao Kit permanece desabilitado sem destino mesmo com linha selecionada", async () => {
    setupApiRouter();
    apiMock.mockImplementation(async (path: string, init?: RequestInit) => {
      if (path === "/aparelhos/pareamento/kits/detalhes") {
        return [buildKitDetalhe({ id: 1, nome: "K" })];
      }
      if (path === "/aparelhos/pareamento/kits/1") {
        return buildKitComAparelhos({ id: 1, nome: "K", aparelhos: [] });
      }
      if (path.includes("aparelhos-destinatarios") && !init?.method) {
        return { assignments: [], quotaUsage: [] };
      }
      if (path.startsWith("/aparelhos/pareamento/aparelhos-disponiveis")) {
        return [
          buildAparelhoNoKit({ id: 200, identificador: "DISP-MISTO" }),
        ];
      }
      throw new Error(path);
    });

    const user = userEvent.setup();
    render(
      <TestApp>
        <ModalSelecaoEKit
          open
          onOpenChange={vi.fn()}
          pedido={buildPedidoView({ tipo: "misto" })}
          pedidoApi={buildPedidoApiMisto()}
          onVincular={vi.fn()}
        />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByRole("cell", { name: "K" })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Escolher/i }));

    await waitFor(() =>
      expect(screen.getByText("DISP-MISTO")).toBeInTheDocument(),
    );

    const addBtn = screen.getByRole("button", { name: /Adicionar ao Kit/i });
    expect(addBtn).toBeDisabled();

    const row = screen.getByText("DISP-MISTO").closest("tr");
    expect(row).toBeTruthy();
    await user.click(within(row!).getByRole("checkbox"));

    expect(addBtn).toBeDisabled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("Salvar e Vincular chama onVincular com quantidade de aparelhos no kit", async () => {
    setupApiRouter();
    const user = userEvent.setup();
    const onVincular = vi.fn();

    render(
      <TestApp>
        <ModalSelecaoEKit
          open
          onOpenChange={vi.fn()}
          pedido={buildPedidoView()}
          pedidoApi={pedidoApiCliente()}
          onVincular={onVincular}
        />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByRole("cell", { name: "KIT-ALPHA" })).toBeInTheDocument(),
    );
    const alphaRow = screen.getByRole("cell", { name: "KIT-ALPHA" }).closest("tr");
    expect(alphaRow).toBeTruthy();
    await user.click(
      within(alphaRow!).getByRole("button", { name: /Escolher/i }),
    );

    await waitFor(() =>
      expect(screen.getByText("NO-KIT")).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", { name: /Salvar e Vincular ao Pedido/i }),
    );

    expect(onVincular).toHaveBeenCalledWith(
      { id: 1, nome: "KIT-ALPHA" },
      1,
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it("kitParaEditar abre direto em edição sem listar detalhes", async () => {
    apiMock.mockImplementation(async (path: string) => {
      if (path === "/aparelhos/pareamento/kits/5") {
        return buildKitComAparelhos({
          id: 5,
          nome: "Direto",
          aparelhos: [],
        });
      }
      if (path.startsWith("/aparelhos/pareamento/aparelhos-disponiveis")) {
        return [];
      }
      throw new Error(path);
    });

    render(
      <TestApp>
        <ModalSelecaoEKit
          open
          onOpenChange={vi.fn()}
          pedido={buildPedidoView()}
          pedidoApi={pedidoApiCliente()}
          onVincular={vi.fn()}
          kitParaEditar={{ id: 5, nome: "Direto" }}
        />
      </TestApp>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /Editar Kit — Direto/i }),
      ).toBeInTheDocument(),
    );

    const paths = apiMock.mock.calls.map((c) => c[0] as string);
    expect(paths.some((p) => p.includes("/kits/detalhes"))).toBe(false);
  });
});
