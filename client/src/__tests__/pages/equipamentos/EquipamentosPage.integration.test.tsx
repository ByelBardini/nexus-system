import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EquipamentosPage } from "@/pages/equipamentos/lista/EquipamentosPage";
import type { EquipamentoListItem } from "@/pages/equipamentos/lista/equipamentos-page.shared";
import { EQUIPAMENTOS_LIST_PAGE_SIZE } from "@/pages/equipamentos/lista/equipamentos-page.shared";

const apiMock = vi.hoisted(() => vi.fn());
const mockHasPermission = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (p: string) => mockHasPermission(p),
  }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function montado(
  overrides: Partial<EquipamentoListItem> &
    Pick<EquipamentoListItem, "id" | "status">,
): EquipamentoListItem {
  return {
    tipo: "RASTREADOR",
    proprietario: "INFINITY",
    criadoEm: "",
    atualizadoEm: "2024-06-01T10:00:00.000Z",
    identificador: `IMEI-${overrides.id}`,
    simVinculado: {
      id: overrides.id,
      identificador: `ICCID-${overrides.id}`,
      operadora: "Vivo",
    },
    ...overrides,
  } as EquipamentoListItem;
}

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

describe("EquipamentosPage (integração)", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
  });

  it("carrega, exibe pipeline e filtra por busca", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          montado({ id: 1, status: "CONFIGURADO", kitId: null }),
          montado({
            id: 2,
            status: "CONFIGURADO",
            kitId: 10,
            identificador: "IMEI-ESPECIAL",
          }),
        ]);
      }
      if (url === "/aparelhos/pareamento/kits") {
        return Promise.resolve([{ id: 10, nome: "Kit Z" }]);
      }
      return Promise.resolve([]);
    });

    render(
      <TestApp>
        <EquipamentosPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("equipamentos-pipeline-strip"),
      ).toBeInTheDocument(),
    );

    const strip = screen.getByTestId("equipamentos-pipeline-strip");
    expect(
      within(strip).getByTestId("equipamentos-pipeline-TODOS"),
    ).toHaveTextContent("2");

    await user.type(screen.getByTestId("equipamentos-busca-input"), "ESPECIAL");
    await waitFor(() =>
      expect(screen.queryByTestId("equipamento-row-1")).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("equipamento-row-2")).toBeInTheDocument();
  });

  it("clique no pipeline EM_KIT filtra apenas com kit", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          montado({ id: 1, status: "CONFIGURADO", kitId: null }),
          montado({ id: 2, status: "CONFIGURADO", kitId: 5 }),
        ]);
      }
      if (url === "/aparelhos/pareamento/kits") {
        return Promise.resolve([{ id: 5, nome: "K" }]);
      }
      return Promise.resolve([]);
    });

    render(
      <TestApp>
        <EquipamentosPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("equipamento-row-1")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("equipamentos-pipeline-EM_KIT"));
    await waitFor(() =>
      expect(screen.queryByTestId("equipamento-row-1")).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("equipamento-row-2")).toBeInTheDocument();
  });

  it("expande linha e mostra painel com histórico", async () => {
    const user = userEvent.setup();
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          montado({
            id: 7,
            status: "INSTALADO",
            historico: [
              {
                statusAnterior: "CONFIGURADO",
                statusNovo: "INSTALADO",
                criadoEm: "2024-06-02T10:00:00.000Z",
              },
            ],
          }),
        ]);
      }
      if (url === "/aparelhos/pareamento/kits") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    render(
      <TestApp>
        <EquipamentosPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("equipamento-row-7")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("equipamento-row-7"));
    await waitFor(() =>
      expect(screen.getByTestId("equipamento-historico")).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId("equipamento-historico")).getByText(
        "Instalado",
      ),
    ).toBeInTheDocument();
  });

  it("paginação: avança página quando há mais itens que PAGE_SIZE", async () => {
    const user = userEvent.setup();
    const many = Array.from(
      { length: EQUIPAMENTOS_LIST_PAGE_SIZE + 4 },
      (_, i) => montado({ id: i + 1, status: "CONFIGURADO", kitId: null }),
    );
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") return Promise.resolve(many);
      if (url === "/aparelhos/pareamento/kits") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    render(
      <TestApp>
        <EquipamentosPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("equipamento-row-1")).toBeInTheDocument(),
    );
    expect(
      screen.queryByTestId(
        `equipamento-row-${EQUIPAMENTOS_LIST_PAGE_SIZE + 1}`,
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("equipamentos-page-next"));
    await waitFor(() =>
      expect(
        screen.getByTestId(
          `equipamento-row-${EQUIPAMENTOS_LIST_PAGE_SIZE + 1}`,
        ),
      ).toBeInTheDocument(),
    );
  });

  it("edge: API retorna apenas SIMs — tabela vazia com total pipeline 0", async () => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          {
            id: 99,
            tipo: "SIM",
            status: "CONFIGURADO",
            proprietario: "INFINITY",
            criadoEm: "",
            atualizadoEm: "",
            simVinculado: { id: 1, identificador: "x" },
          } as EquipamentoListItem,
        ]);
      }
      if (url === "/aparelhos/pareamento/kits") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    render(
      <TestApp>
        <EquipamentosPage />
      </TestApp>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("equipamentos-empty")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("equipamentos-pipeline-TODOS")).toHaveTextContent(
      "0",
    );
  });
});
