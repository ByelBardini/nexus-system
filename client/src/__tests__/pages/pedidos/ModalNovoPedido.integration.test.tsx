import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ModalNovoPedido } from "@/pages/pedidos/novo-pedido/ModalNovoPedido";
import type { ReactNode } from "react";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, nome: "Teste User" } }),
}));

function Providers({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.mockReset();
  api.mockImplementation((url: string, o?: { method?: string; body?: string }) => {
    if (String(url) === "/pedidos-rastreadores" && o?.method === "POST")
      return Promise.resolve({ ok: true });
    if (url === "/tecnicos")
      return Promise.resolve([{ id: 1, nome: "Tec A", cidade: "S", estado: "SP" }]);
    if (url === "/clientes?subclientes=1")
      return Promise.resolve([{ id: 2, nome: "Cl B", subclientes: [] }]);
    if (url === "/equipamentos/marcas") return Promise.resolve([]);
    if (url === "/equipamentos/modelos") return Promise.resolve([]);
    if (url === "/equipamentos/operadoras") return Promise.resolve([]);
    return Promise.resolve(null);
  });
});

describe("ModalNovoPedido (integração E2E do modal)", () => {
  it("abre: mostra título, criador, botões do rodapé e fechar; cancelar chama onOpenChange(false)", async () => {
    const u = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();
    render(
      <Providers>
        <ModalNovoPedido
          open
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </Providers>,
    );
    expect(
      await screen.findByText("Novo Pedido de Rastreador"),
    ).toBeInTheDocument();
    expect(screen.getByText("Teste User")).toBeInTheDocument();
    expect(screen.getByText("Enviar Solicitação")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("fechar (X) também encerra: chama onOpenChange(false) via handleClose", async () => {
    const u = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();
    render(
      <Providers>
        <ModalNovoPedido
          open
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </Providers>,
    );
    await u.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
