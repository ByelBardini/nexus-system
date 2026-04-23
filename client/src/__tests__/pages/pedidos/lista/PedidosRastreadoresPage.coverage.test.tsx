import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PedidosRastreadoresPage } from "@/pages/pedidos/PedidosRastreadoresPage";
import type { PedidoRastreadorApi } from "@/types/pedidos-rastreador";
import { toast } from "sonner";

const apiMock = vi.hoisted(() => vi.fn());
const deleteRequest = vi.hoisted(() => vi.fn());

function makeTecnicoSolicitado(
  id = 7,
  codigo = "PED-L-7",
): PedidoRastreadorApi {
  return {
    id,
    codigo,
    tipoDestino: "TECNICO",
    tecnicoId: 1,
    clienteId: null,
    subclienteId: null,
    quantidade: 1,
    status: "SOLICITADO",
    urgencia: "MEDIA",
    observacao: null,
    criadoPorId: 1,
    criadoEm: "2024-01-01T00:00:00.000Z",
    atualizadoEm: "2024-01-01T00:00:00.000Z",
    entregueEm: null,
    tecnico: { id: 1, nome: "Técnico L" },
  };
}

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => {
    const o = a[1];
    if (
      o &&
      typeof o === "object" &&
      (o as { method?: string }).method === "DELETE"
    ) {
      deleteRequest(a[0], o);
      return Promise.resolve({});
    }
    return apiMock(...a);
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) => p === "AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR",
    user: { nome: "U" },
  }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

vi.mock("@/pages/pedidos/novo-pedido/ModalNovoPedido", () => ({
  ModalNovoPedido: ({
    open,
    onOpenChange,
    onSuccess,
  }: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSuccess: () => void;
  }) =>
    open ? (
      <div data-testid="modal-novo-mock">
        <button
          type="button"
          onClick={() => {
            onSuccess();
            onOpenChange(false);
          }}
        >
          dispara-sucesso-novo
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          fechar-novo
        </button>
      </div>
    ) : null,
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { W, invalidateSpy, queryClient };
}

function waitForSolicitacao() {
  return screen.findByText("Solicitação Detalhada", {}, { timeout: 10000 });
}

async function abreConfirmarExcluir(
  user: Awaited<ReturnType<typeof userEvent.setup>>,
) {
  const list = await screen.findAllByRole("button", { name: "Excluir" });
  await user.click(list[0]);
  const h = await screen.findByRole("heading", { name: "Excluir pedido" });
  const dlg = h.closest('[role="dialog"]');
  if (!dlg) throw new Error("Dialog de confirmação inesperadamente ausente");
  return dlg as HTMLElement;
}

describe("PedidosRastreadoresPage — interação Kanban, modal e API", () => {
  beforeEach(() => {
    deleteRequest.mockReset();
    apiMock.mockReset();
    vi.mocked(toast.success).mockClear();
    apiMock.mockImplementation((path: string) => {
      if (String(path).includes("pedidos-rastreadores")) {
        return Promise.resolve({ data: [makeTecnicoSolicitado()] });
      }
      return Promise.resolve(null);
    });
  });

  it("abre o drawer no clique e mostra o código e o título de contexto (destinatário/fluxo visível)", async () => {
    const { W } = makeWrapper();
    const user = userEvent.setup();
    render(
      <W>
        <PedidosRastreadoresPage />
      </W>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    const card = await screen.findByRole("button", { name: /PED-L-7/ });
    await user.click(card);
    const titulo = await waitForSolicitacao();
    const codigo = titulo.parentElement
      ?.querySelector("p")
      ?.textContent?.trim();
    expect(codigo).toBe("PED-L-7");
  });

  it("com foco no card, Enter abre o drawer (onKeyDown do KanbanCard)", async () => {
    const { W } = makeWrapper();
    render(
      <W>
        <PedidosRastreadoresPage />
      </W>,
    );
    const card = await screen.findByRole("button", { name: /PED-L-7/ });
    expect(card).toHaveAttribute("tabindex", "0");
    card.focus();
    fireEvent.keyDown(card, { key: "Enter" });
    expect(await waitForSolicitacao()).toBeInTheDocument();
  });

  it("Novo pedido: onSuccess invalida a query `pedidos-rastreadores` (lista atualiza pós-criação)", async () => {
    const { W, invalidateSpy } = makeWrapper();
    const user = userEvent.setup();
    render(
      <W>
        <PedidosRastreadoresPage />
      </W>,
    );
    await waitFor(() => expect(apiMock).toHaveBeenCalled());
    await screen.findByText(/Novo Pedido/);
    await user.click(screen.getByText("Novo Pedido", { exact: false }));
    expect(screen.getByTestId("modal-novo-mock")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "dispara-sucesso-novo" }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["pedidos-rastreadores"] }),
    );
    expect(screen.queryByTestId("modal-novo-mock")).not.toBeInTheDocument();
  });

  it("Novo pedido: fechar sem sucesso não invalida a lista (evita refetch inútil)", async () => {
    const { W, invalidateSpy } = makeWrapper();
    const user = userEvent.setup();
    render(
      <W>
        <PedidosRastreadoresPage />
      </W>,
    );
    await screen.findByText(/Novo Pedido/);
    await user.click(screen.getByText("Novo Pedido", { exact: false }));
    await user.click(screen.getByRole("button", { name: "fechar-novo" }));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("exclusão: DELETE `DELETE /pedidos-rastreadores/:id` e invalida a lista; onDeleted limpa o drawer", async () => {
    const { W, invalidateSpy } = makeWrapper();
    const user = userEvent.setup();
    render(
      <W>
        <PedidosRastreadoresPage />
      </W>,
    );
    await user.click(await screen.findByRole("button", { name: /PED-L-7/ }));
    await waitForSolicitacao();
    const confirmRoot = await abreConfirmarExcluir(user);
    await user.click(
      within(confirmRoot).getByRole("button", { name: "Excluir" }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(deleteRequest).toHaveBeenCalledWith(
      expect.stringMatching(/pedidos-rastreadores\/7/),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["pedidos-rastreadores"] }),
    );
    expect(screen.queryByText("Solicitação Detalhada")).not.toBeInTheDocument();
  });

  it("cancelar a exclusão: drawer permanece e sucesso de exclusão não dispara", async () => {
    const { W } = makeWrapper();
    const user = userEvent.setup();
    render(
      <W>
        <PedidosRastreadoresPage />
      </W>,
    );
    await user.click(await screen.findByRole("button", { name: /PED-L-7/ }));
    await waitForSolicitacao();
    const confirmRoot = await abreConfirmarExcluir(user);
    await user.click(
      within(confirmRoot).getByRole("button", { name: "Cancelar" }),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByText("Solicitação Detalhada")).toBeInTheDocument();
    expect(deleteRequest).not.toHaveBeenCalled();
  });

  it("Fechar o drawer: mantém a lista, permite reabrir o mesmo card", async () => {
    const { W } = makeWrapper();
    const user = userEvent.setup();
    render(
      <W>
        <PedidosRastreadoresPage />
      </W>,
    );
    await user.click(await screen.findByRole("button", { name: /PED-L-7/ }));
    await waitForSolicitacao();
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Solicitação Detalhada" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText("Novo Pedido", { exact: false }),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /PED-L-7/ }));
    expect(await waitForSolicitacao()).toBeInTheDocument();
  });
});
