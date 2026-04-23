import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DrawerDetalhes } from "@/pages/pedidos/lista/components/DrawerDetalhes";
import type { PedidoRastreadorView } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { toast } from "sonner";

const apiDelete = vi.hoisted(() => vi.fn());
const authExcluir = vi.hoisted(() => ({ value: true }));

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => {
    const o = a[1];
    if (o && typeof o === "object" && (o as { method?: string }).method === "DELETE") {
      return apiDelete(a[0], o);
    }
    return Promise.resolve(null);
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) =>
      p === "AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR"
        ? authExcluir.value
        : true,
  }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

const base: PedidoRastreadorView = {
  id: 1,
  codigo: "PED-DW-1",
  destinatario: "D",
  tipo: "tecnico",
  quantidade: 4,
  status: "em_configuracao",
  dataSolicitacao: "2024-01-15T12:00:00.000Z",
};

function withUi(ui: ReactNode, options?: { spyInvalidate: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate =
    options?.spyInvalidate === true
      ? vi.spyOn(queryClient, "invalidateQueries")
      : null;
  const view: RenderResult = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
  return {
    queryClient,
    invalidate,
    view,
  };
}

function confirmarExcluirDialog() {
  return screen
    .getByRole("heading", { name: "Excluir pedido" })
    .closest('[role="dialog"]') as HTMLElement;
}

describe("DrawerDetalhes — conteúdo, edge cases e exclusão (API + cache)", () => {
  beforeEach(() => {
    authExcluir.value = true;
    apiDelete.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("pedido null: nada no DOM (hooks existem, mas o painel não monta o Sheet)", () => {
    const { view } = withUi(
      <DrawerDetalhes pedido={null} open onOpenChange={vi.fn()} />,
    );
    expect(view.container.firstChild).toBeNull();
  });

  it("Tipo de destino: Cliente, Técnico e Misto no mesmo bloco informativo", () => {
    const tec = withUi(
      <DrawerDetalhes pedido={base} open onOpenChange={vi.fn()} />,
    );
    const geral = tec.view.getByText("Informações Gerais").parentElement;
    expect(
      within(geral as HTMLElement).getByText("Técnico", { selector: "p" }),
    ).toBeInTheDocument();
    tec.view.unmount();

    const cli = withUi(
      <DrawerDetalhes
        pedido={{ ...base, tipo: "cliente" }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(
      within(
        cli.view.getByText("Informações Gerais")
          .parentElement as HTMLElement,
      ).getByText("Cliente", { selector: "p" }),
    ).toBeInTheDocument();
    cli.view.unmount();

    const mis = withUi(
      <DrawerDetalhes
        pedido={{ ...base, tipo: "misto" }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(
      within(
        mis.view.getByText("Informações Gerais")
          .parentElement as HTMLElement,
      ).getByText("Misto", { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("Misto: tabela e total; itensMisto vazio esconde a seção (evita tabela inútil)", () => {
    const { view } = withUi(
      <DrawerDetalhes
        pedido={{
          ...base,
          tipo: "misto",
          itensMisto: [
            { label: "Infinity", quantidade: 1 },
            { label: "ACME", quantidade: 3 },
          ],
        }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(
      view.getByRole("heading", { name: "Distribuição dos Itens" }),
    ).toBeInTheDocument();
    const table = view.getByRole("table");
    const tfoot = table.querySelector("tfoot");
    expect(tfoot).toBeTruthy();
    expect(tfoot as HTMLElement).toHaveTextContent("Total");
    expect(tfoot as HTMLElement).toHaveTextContent("4");
    const qc2 = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    view.rerender(
      <QueryClientProvider client={qc2}>
        <DrawerDetalhes
          pedido={{ ...base, tipo: "misto", itensMisto: [] }}
          open
          onOpenChange={vi.fn()}
        />
      </QueryClientProvider>,
    );
    expect(
      view.queryByRole("heading", { name: "Distribuição dos Itens" }),
    ).not.toBeInTheDocument();
  });

  it("Data do Pedido: hífen só quando a data vem vazia (campo, não o resto do sheet)", () => {
    const p: PedidoRastreadorView = { ...base, dataSolicitacao: undefined };
    withUi(
      <DrawerDetalhes pedido={p} open onOpenChange={vi.fn()} />,
    );
    const cél = screen
      .getByText("Data do Pedido", { exact: true })
      .parentElement;
    const ps = cél?.querySelectorAll("p");
    expect(ps?.[1]?.textContent).toBe("-");
  });

  it("Cabeçalho destino: três rótulos possíveis conforme endereço/contato", () => {
    const a = withUi(
      <DrawerDetalhes
        pedido={{ ...base, endereco: "Rua A" }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(a.view.getByText("Endereço (Destino)")).toBeInTheDocument();
    a.view.unmount();

    const b = withUi(
      <DrawerDetalhes
        pedido={{ ...base, contato: { nome: "N1", email: "a@a.com" } }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(
      b.view.getByText("Meios de Contato (Destino)"),
    ).toBeInTheDocument();
    b.view.unmount();

    const c = withUi(
      <DrawerDetalhes
        pedido={{
          ...base,
          endereco: "E",
          contato: { nome: "N2", telefone: "11" },
        }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(
      c.view.getByText("Endereço e Contato (Destino)"),
    ).toBeInTheDocument();
  });

  it("Contato: telefone sem e-mail não renderiza a coluna e-mail", () => {
    withUi(
      <DrawerDetalhes
        pedido={{
          ...base,
          contato: { nome: "N", telefone: "119999" },
        }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("119999")).toBeInTheDocument();
    expect(screen.getByText("Telefone")).toBeInTheDocument();
    expect(screen.queryByText("E-mail", { exact: true })).not.toBeInTheDocument();
  });

  it("Contato: só e-mail (sem telefone) — sem o label Telefone", () => {
    withUi(
      <DrawerDetalhes
        pedido={{ ...base, contato: { nome: "N", email: "x@y.com" } }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("x@y.com")).toBeInTheDocument();
    expect(screen.queryByText("Telefone", { exact: true })).not.toBeInTheDocument();
  });

  it("Contato: com telefone e e-mail — células na mesma grelha", () => {
    withUi(
      <DrawerDetalhes
        pedido={{
          ...base,
          contato: { nome: "N", telefone: "11", email: "2@3.com" },
        }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("2@3.com")).toBeInTheDocument();
  });

  it("marca/modelo, operadora e de cliente: campos condicionais só com dados", () => {
    withUi(
      <DrawerDetalhes
        pedido={{
          ...base,
          marcaModelo: "M - N",
          operadora: "Vivo",
          deCliente: "Loja A",
        }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("M - N")).toBeInTheDocument();
    expect(screen.getByText("Vivo")).toBeInTheDocument();
    expect(screen.getByText("Loja A")).toBeInTheDocument();
  });

  it("linha do tempo: concluído (destaque mais forte) vs pendente (texto atenuado)", () => {
    withUi(
      <DrawerDetalhes
        pedido={{
          ...base,
          historico: [
            { titulo: "A", descricao: "a", concluido: true },
            { titulo: "B", descricao: "b", concluido: false },
          ],
        }}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("A")).toHaveClass("text-slate-800");
    expect(screen.getByText("B")).toHaveClass("text-slate-400");
  });

  it("sem permissão de excluir: não há ação destrutiva; Fechar full width", () => {
    authExcluir.value = false;
    withUi(
      <DrawerDetalhes pedido={base} open onOpenChange={vi.fn()} />,
    );
    expect(
      screen.queryByRole("button", { name: "Excluir" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveClass("w-full");
  });

  it("excluir: DELETE com path certo, invalida `pedidos-rastreadores` e toasts/ callbacks", async () => {
    const onOpen = vi.fn();
    const onDeleted = vi.fn();
    apiDelete.mockResolvedValue({});
    const { invalidate } = withUi(
      <DrawerDetalhes
        pedido={base}
        open
        onOpenChange={onOpen}
        onDeleted={onDeleted}
      />,
      { spyInvalidate: true },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(
      within(confirmarExcluirDialog()).getByRole("button", { name: "Excluir" }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Pedido excluído com sucesso"),
    );
    expect(apiDelete).toHaveBeenCalledWith(
      expect.stringMatching(/\/pedidos-rastreadores\/1/),
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["pedidos-rastreadores"] }),
    );
    expect(onOpen).toHaveBeenCalledWith(false);
    expect(onDeleted).toHaveBeenCalled();
  });

  it("excluir: Error na API mostra a mensagem no toast", async () => {
    apiDelete.mockRejectedValue(new Error("Servidor 502"));
    withUi(
      <DrawerDetalhes pedido={base} open onOpenChange={vi.fn()} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(
      within(confirmarExcluirDialog()).getByRole("button", { name: "Excluir" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Servidor 502"),
    );
  });

  it("excluir: rejeição não-Error cai no texto genérico (contrato onError do mutation)", async () => {
    apiDelete.mockRejectedValue("erro de rede");
    withUi(
      <DrawerDetalhes pedido={base} open onOpenChange={vi.fn()} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(
      within(confirmarExcluirDialog()).getByRole("button", { name: "Excluir" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Erro ao excluir pedido"),
    );
  });

  it("Fechar: onOpenChange(false) e nenhum DELETE", async () => {
    const onOpen = vi.fn();
    withUi(
      <DrawerDetalhes pedido={base} open onOpenChange={onOpen} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onOpen).toHaveBeenCalledWith(false);
    expect(apiDelete).not.toHaveBeenCalled();
  });
});
