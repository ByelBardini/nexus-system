import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CadastroRastreamentoPage } from "@/pages/cadastro-rastreamento/CadastroRastreamentoPage";
import { osRespostaBase } from "./cadastro-rastreamento.fixtures";

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <CadastroRastreamentoPage />
    </QueryClientProvider>,
  );
}

describe("CadastroRastreamentoPage (integração)", () => {
  beforeEach(() => {
    apiMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.startsWith("/cadastro-rastreamento?")) {
        return Promise.resolve({ data: [osRespostaBase], total: 1 });
      }
      if (url.includes("/iniciar")) return Promise.resolve({});
      if (url.includes("/concluir")) return Promise.resolve({});
      return Promise.resolve({ data: [], total: 0 });
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("carrega e exibe cliente na tabela e na mesa após selecionar", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("Cliente X")).toBeInTheDocument();
    await user.click(screen.getAllByText("Cliente X")[0]);
    expect(screen.getAllByText("Cliente X").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/mesa de trabalho/i)).toBeInTheDocument();
  });

  it("exibe contagem no rodapé", async () => {
    renderPage();
    expect(await screen.findByText(/1 ordem\(ns\) encontrada\(s\)/i)).toBeInTheDocument();
  });
});
