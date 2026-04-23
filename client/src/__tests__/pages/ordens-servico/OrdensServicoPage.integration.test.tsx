import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
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

function findLastStatusPatchCall() {
  const patches = apiMock.mock.calls.filter(
    ([url, init]) =>
      /\/ordens-servico\/\d+\/status$/.test(String(url)) &&
      (init as RequestInit | undefined)?.method === "PATCH",
  );
  return patches.length ? patches[patches.length - 1] : null;
}

function countStatusPatchCalls() {
  return apiMock.mock.calls.filter(
    ([url, init]) =>
      /\/ordens-servico\/\d+\/status$/.test(String(url)) &&
      (init as RequestInit | undefined)?.method === "PATCH",
  ).length;
}

function parseStatusPatchBody(call: unknown[]): { status?: string; observacao?: string } {
  const init = call[1] as RequestInit;
  return JSON.parse(String(init.body)) as {
    status?: string;
    observacao?: string;
  };
}

describe("OrdensServicoPage (integração)", () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
    mockHasPermission.mockReturnValue(true);
    mockNavigate.mockClear();
    apiMock.mockReset();
    apiDownloadBlobMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  function mockApisWithLista() {
    apiMock.mockImplementation((url: unknown, init?: RequestInit) => {
      const u = String(url);
      if (/\/ordens-servico\/\d+\/status$/.test(u) && init?.method === "PATCH") {
        return Promise.resolve({});
      }
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

  function mockApisComRetiradaAgendada() {
    apiMock.mockImplementation((url: unknown, init?: RequestInit) => {
      const u = String(url);
      if (/\/ordens-servico\/\d+\/status$/.test(u) && init?.method === "PATCH") {
        return Promise.resolve({});
      }
      if (u === "/ordens-servico/resumo") {
        return Promise.resolve({
          agendado: 1,
          emTestes: 0,
          testesRealizados: 0,
          aguardandoCadastro: 0,
          finalizado: 0,
        });
      }
      if (u.startsWith("/ordens-servico?")) {
        return Promise.resolve({
          data: [
            {
              id: 20,
              numero: 200,
              tipo: "RETIRADA",
              status: "AGENDADO",
              cliente: { id: 1, nome: "Cliente R" },
              criadoEm: "2024-01-01T10:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          limit: 15,
          totalPages: 1,
        });
      }
      if (u === "/ordens-servico/20") {
        return Promise.resolve({
          id: 20,
          numero: 200,
          tipo: "RETIRADA",
          status: "AGENDADO",
          idAparelho: "RAST-1",
          observacoes: null,
          criadoEm: "2024-01-01T10:00:00.000Z",
          cliente: { id: 1, nome: "Cliente R" },
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
    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/ordens-servico\?.*page=1/),
      ),
    );
    await waitFor(() =>
      expect(apiMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/ordens-servico\?.*limit=15/),
      ),
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

  it("Iniciar testes: cancelar e fechar (X) fecham o diálogo sem PATCH de status", async () => {
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
    const antes = countStatusPatchCalls();
    await user.click(screen.getByTestId("ordens-servico-btn-iniciar-testes"));
    expect(
      screen.getByTestId("ordens-servico-dialog-iniciar-testes"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByTestId("ordens-servico-dialog-iniciar-cancelar"),
    );
    expect(countStatusPatchCalls()).toBe(antes);

    await user.click(screen.getByTestId("ordens-servico-btn-iniciar-testes"));
    await user.click(
      screen.getByTestId("ordens-servico-dialog-iniciar-fechar"),
    );
    expect(countStatusPatchCalls()).toBe(antes);
  });

  it("Iniciar testes: confirma envia PATCH com status EM_TESTES (JSON)", async () => {
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
    await user.click(
      screen.getByTestId("ordens-servico-dialog-iniciar-confirmar"),
    );

    await waitFor(() => expect(countStatusPatchCalls()).toBeGreaterThan(0));
    const call = findLastStatusPatchCall();
    expect(call).not.toBeNull();
    expect(String(call![0])).toBe("/ordens-servico/10/status");
    expect(parseStatusPatchBody(call!)).toEqual({ status: "EM_TESTES" });
  });

  it("retirada realizada: 'Sim' envia AGUARDANDO_CADASTRO e observação com Aparelho encontrado: Sim", async () => {
    const user = userEvent.setup();
    mockApisComRetiradaAgendada();

    render(
      <TestApp>
        <OrdensServicoPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-row-20")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("ordens-servico-row-20"));
    await waitFor(() =>
      expect(
        screen.getByTestId("ordens-servico-btn-retirada-realizada"),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("ordens-servico-btn-retirada-realizada"));
    expect(
      screen.getByTestId("ordens-servico-dialog-retirada"),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("ordens-servico-dialog-retirada-sim"));
    await waitFor(() => expect(countStatusPatchCalls()).toBeGreaterThan(0));
    const call = findLastStatusPatchCall();
    expect(String(call![0])).toBe("/ordens-servico/20/status");
    const body = parseStatusPatchBody(call!);
    expect(body.status).toBe("AGUARDANDO_CADASTRO");
    expect(body.observacao).toMatch(
      /Data retirada:.*\| Aparelho encontrado: Sim/,
    );
  });

  it("retirada realizada: 'Não' grava aparelho não encontrado na observação", async () => {
    const user = userEvent.setup();
    mockApisComRetiradaAgendada();

    render(
      <TestApp>
        <OrdensServicoPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-row-20")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("ordens-servico-row-20"));
    await user.click(
      await screen.findByTestId("ordens-servico-btn-retirada-realizada"),
    );
    await user.click(
      screen.getByTestId("ordens-servico-dialog-retirada-nao"),
    );
    await waitFor(() => expect(countStatusPatchCalls()).toBeGreaterThan(0));
    const body = parseStatusPatchBody(findLastStatusPatchCall()!);
    expect(body.observacao).toMatch(
      /Data retirada:.*\| Aparelho encontrado: Não/,
    );
  });

  it("sem AGENDAMENTO.OS.EDITAR: ações de mudança de status ficam desabilitadas", async () => {
    mockHasPermission.mockImplementation(
      (p) => p !== "AGENDAMENTO.OS.EDITAR",
    );
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
    const iniciar = await screen.findByTestId(
      "ordens-servico-btn-iniciar-testes",
    );
    expect(iniciar).toBeDisabled();
  });

  it("PATCH de status rejeitado: toast de erro com a mensagem do servidor", async () => {
    mockApisWithLista();
    const firstImpl = apiMock.getMockImplementation()!;
    apiMock.mockImplementation((url, init) => {
      const u = String(url);
      if (/\/ordens-servico\/\d+\/status$/.test(u) && init?.method === "PATCH") {
        return Promise.reject(new Error("conflito de concorrência"));
      }
      return firstImpl!(url, init);
    });
    const user = userEvent.setup();

    render(
      <TestApp>
        <OrdensServicoPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("ordens-servico-row-10")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("ordens-servico-row-10"));
    await user.click(
      await screen.findByTestId("ordens-servico-btn-iniciar-testes"),
    );
    await user.click(
      screen.getByTestId("ordens-servico-dialog-iniciar-confirmar"),
    );
    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "conflito de concorrência",
      ),
    );
  });
});
