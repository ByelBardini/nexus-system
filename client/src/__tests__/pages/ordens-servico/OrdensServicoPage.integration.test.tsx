import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdensServicoPage } from "@/pages/ordens-servico/OrdensServicoPage";

const apiMock = vi.hoisted(() => vi.fn());
const apiDownloadBlobMock = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockHasPermission = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => apiMock(...a),
  apiDownloadBlob: (...a: unknown[]) => apiDownloadBlobMock(...a),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: (p: string) => mockHasPermission(p) }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function TestApp({ children }: { children: ReactNode }) {
  const qc = createClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("OrdensServicoPage (integração)", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockNavigate.mockClear();
    apiMock.mockReset();
    apiDownloadBlobMock.mockReset();
  });

  function mockApisWithLista() {
    apiMock.mockImplementation((url: unknown) => {
      const u = String(url);
      if (u === "/ordens-servico/resumo") {
        return Promise.resolve({
          agendado: 2,
          emTestes: 1,
          testesRealizados: 0,
          aguardandoCadastro: 0,
          finalizado: 0,
        });
      }
      if (u.startsWith("/ordens-servico?")) {
        return Promise.resolve({
          data: [
            {
              id: 10,
              numero: 100,
              tipo: "INSTALACAO",
              status: "AGENDADO",
              cliente: { id: 1, nome: "Cliente Z" },
              criadoEm: "2024-01-01T10:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          limit: 15,
          totalPages: 1,
        });
      }
      if (u === "/ordens-servico/10") {
        return Promise.resolve({
          id: 10,
          numero: 100,
          tipo: "INSTALACAO",
          status: "AGENDADO",
          observacoes: null,
          criadoEm: "2024-01-01T10:00:00.000Z",
          cliente: { id: 1, nome: "Cliente Z" },
        });
      }
      return Promise.reject(new Error(`unexpected ${u}`));
    });
  }

  it("fluxo: pipeline, busca e expansão com detalhe", async () => {
    const user = userEvent.setup();
    mockApisWithLista();

    render(
      <TestApp>
        <OrdensServicoPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-page")).toBeInTheDocument(),
    );

    const strip = screen.getByTestId("ordens-servico-pipeline-strip");
    expect(within(strip).getByTestId("ordens-servico-pipeline-TODOS")).toHaveTextContent(
      "3",
    );

    await user.click(within(strip).getByTestId("ordens-servico-pipeline-EM_TESTES"));
    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        expect.stringContaining("status=EM_TESTES"),
      ),
    );

    await user.type(screen.getByTestId("ordens-servico-busca-input"), "Z");
    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        expect.stringContaining("search=Z"),
      ),
    );

    await user.click(screen.getByTestId("ordens-servico-row-10"));
    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-detalhe-panel")).toBeInTheDocument(),
    );
    expect(screen.getByText("Dados de Emissão")).toBeInTheDocument();
  });

  it("Nova OS respeita permissão", async () => {
    mockHasPermission.mockReturnValue(false);
    mockApisWithLista();

    render(
      <TestApp>
        <OrdensServicoPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-page")).toBeInTheDocument(),
    );
    expect(
      screen.queryByTestId("ordens-servico-btn-nova"),
    ).not.toBeInTheDocument();
  });

  it("edge: loading inicial de resumo", () => {
    apiMock.mockImplementation(
      () => new Promise(() => {/* never */}),
    );
    render(
      <TestApp>
        <OrdensServicoPage />
      </TestApp>,
    );
    expect(screen.getByTestId("ordens-servico-loading-resumo")).toBeInTheDocument();
  });

  it("diálogo iniciar testes após clique no painel", async () => {
    const user = userEvent.setup();
    mockApisWithLista();

    render(
      <TestApp>
        <OrdensServicoPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-row-10")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("ordens-servico-row-10"));
    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-btn-iniciar-testes")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("ordens-servico-btn-iniciar-testes"));
    expect(
      screen.getByTestId("ordens-servico-dialog-iniciar-testes"),
    ).toBeInTheDocument();
  });
});
