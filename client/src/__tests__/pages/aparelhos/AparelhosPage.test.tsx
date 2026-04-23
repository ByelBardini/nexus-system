import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AparelhosPage } from "@/pages/aparelhos/AparelhosPage";
import type { Aparelho } from "@/pages/aparelhos/lista/aparelhos-page.shared";
import { PAGE_SIZE } from "@/pages/aparelhos/lista/aparelhos-page.shared";
import { aparelhoFixture } from "./fixtures";

function aparelhoLinhaContagem(i: number): Aparelho {
  return aparelhoFixture({
    id: i,
    tipo: "RASTREADOR",
    status: "EM_ESTOQUE",
    proprietario: "INFINITY",
    identificador: `N-${String(i).padStart(3, "0")}`,
    marca: "UnicaMarca",
    modelo: "M1",
  });
}

const apiMock = vi.hoisted(() => vi.fn());
const hasPermissionMock = vi.hoisted(() =>
  vi.fn<(perm: string) => boolean>(() => true),
);

vi.mock("@/lib/api", () => ({
  api: (...args: unknown[]) => apiMock(...args),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ hasPermission: hasPermissionMock }),
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/SearchableSelect", () => ({
  SearchableSelect: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      aria-label="searchable-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return render(<AparelhosPage />, { wrapper: Wrapper });
}

describe("AparelhosPage (fluxo integrado)", () => {
  beforeEach(() => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve([
          aparelhoFixture({
            id: 1,
            tipo: "RASTREADOR",
            status: "EM_ESTOQUE",
            proprietario: "INFINITY",
            identificador: "IMEI-ALPHA",
            marca: "MarcaGps",
            modelo: "ModA",
            tecnico: { id: 1, nome: "Técnico Silva" },
            lote: { id: 1, referencia: "L2024" },
          }),
          aparelhoFixture({
            id: 2,
            tipo: "SIM",
            status: "CONFIGURADO",
            proprietario: "CLIENTE",
            cliente: { id: 9, nome: "Cliente Beta" },
            identificador: "890",
            operadora: "Vivo",
          }),
        ] satisfies Aparelho[]);
      }
      if (url === "/aparelhos/pareamento/kits") {
        return Promise.resolve([{ id: 1, nome: "Kit K" }]);
      }
      return Promise.resolve([]);
    });
    hasPermissionMock.mockImplementation(() => true);
  });

  it("carrega pipeline, busca filtra por técnico e expande linha", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByTestId("aparelhos-status-pipeline"),
      ).toBeInTheDocument(),
    );

    expect(screen.getByTestId("aparelhos-toolbar")).toBeInTheDocument();

    const busca = screen.getByTestId("aparelhos-busca-input");
    await user.clear(busca);
    await user.type(busca, "Silva");

    await waitFor(() => {
      expect(screen.getByText("IMEI-ALPHA")).toBeInTheDocument();
      expect(screen.queryByText("890")).not.toBeInTheDocument();
    });

    await user.click(screen.getByTestId("aparelho-row-1"));
    expect(screen.getByTestId("aparelho-expanded-1")).toBeInTheDocument();
  });

  it("clique no card de status filtra lista", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId("aparelhos-status-configurado"));
    await waitFor(() => {
      expect(screen.queryByTestId("aparelho-row-1")).toBeNull();
      expect(screen.getByTestId("aparelho-row-2")).toBeInTheDocument();
    });
  });

  it("edge: busca sem match mostra vazio", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );

    const busca = screen.getByTestId("aparelhos-busca-input");
    await user.clear(busca);
    await user.type(busca, "não-existe-xyz");

    await waitFor(() => {
      expect(screen.getByTestId("aparelhos-empty")).toBeInTheDocument();
    });
  });

  it("sem permissão de criar oculta atalhos do toolbar", async () => {
    hasPermissionMock.mockImplementation(
      (p) => p !== "CONFIGURACAO.APARELHO.CRIAR",
    );
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelhos-toolbar")).toBeInTheDocument(),
    );

    expect(screen.queryByTestId("aparelhos-link-lote")).toBeNull();
  });

  it("toolbar: filtro de status Em Estoque isola o rastreador", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );

    const statusSelect = within(
      screen.getByTestId("aparelhos-filter-status"),
    ).getByLabelText("searchable-select");
    await user.selectOptions(statusSelect, "EM_ESTOQUE");
    await waitFor(() => {
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument();
      expect(screen.queryByTestId("aparelho-row-2")).toBeNull();
    });
  });

  it("toolbar: filtro de tipo Rastreador isola o rastreador", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );
    const tipoSelect = within(
      screen.getByTestId("aparelhos-filter-tipo"),
    ).getByLabelText("searchable-select");
    await user.selectOptions(tipoSelect, "RASTREADOR");
    await waitFor(() => {
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument();
      expect(screen.queryByTestId("aparelho-row-2")).toBeNull();
    });
  });

  it("toolbar: filtro de proprietário Cliente isola o SIM com cliente", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );
    const propSelect = within(
      screen.getByTestId("aparelhos-filter-proprietario"),
    ).getByLabelText("searchable-select");
    await user.selectOptions(propSelect, "CLIENTE");
    await waitFor(() => {
      expect(screen.queryByTestId("aparelho-row-1")).toBeNull();
      expect(screen.getByTestId("aparelho-row-2")).toBeInTheDocument();
    });
  });

  it("toolbar: filtro de marca/operadora Vivo isola o SIM com operadora", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );
    const marcaSelect = within(
      screen.getByTestId("aparelhos-filter-marca"),
    ).getByLabelText("searchable-select");
    await user.selectOptions(marcaSelect, "Vivo");
    await waitFor(() => {
      expect(screen.queryByTestId("aparelho-row-1")).toBeNull();
      expect(screen.getByTestId("aparelho-row-2")).toBeInTheDocument();
    });
  });

  it("com lista vazia: pipeline em zero e tabela vazia sem erro", async () => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") return Promise.resolve([] satisfies Aparelho[]);
      if (url === "/aparelhos/pareamento/kits")
        return Promise.resolve([{ id: 1, nome: "Kit K" }]);
      return Promise.resolve([]);
    });
    renderPage();
    const total = await screen.findByTestId("aparelhos-status-total");
    expect(within(total).getByText("0", { exact: true })).toBeInTheDocument();
    expect(screen.getByTestId("aparelhos-empty")).toBeInTheDocument();
  });

  it("permutação: SIM + Proprietário Infinity não exige linhas (interseção vazia)", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );
    const tipo = within(
      screen.getByTestId("aparelhos-filter-tipo"),
    ).getByLabelText("searchable-select");
    const prop = within(
      screen.getByTestId("aparelhos-filter-proprietario"),
    ).getByLabelText("searchable-select");
    await user.selectOptions(tipo, "SIM");
    await user.selectOptions(prop, "INFINITY");
    await waitFor(() => {
      expect(screen.getByTestId("aparelhos-empty")).toBeInTheDocument();
    });
  });

  it("após filtrar operadora, voltar a Todas restaura as duas linhas", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );
    const marca = within(
      screen.getByTestId("aparelhos-filter-marca"),
    ).getByLabelText("searchable-select");
    await user.selectOptions(marca, "Vivo");
    await waitFor(() =>
      expect(screen.queryByTestId("aparelho-row-1")).toBeNull(),
    );
    await user.selectOptions(marca, "TODOS");
    await waitFor(() => {
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument();
      expect(screen.getByTestId("aparelho-row-2")).toBeInTheDocument();
    });
  });

  it("falha ao carregar /aparelhos: não quebra a tela (lista cai no default vazio)", async () => {
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos")
        return Promise.reject(new Error("API indisponível"));
      if (url === "/aparelhos/pareamento/kits")
        return Promise.resolve([{ id: 1, nome: "Kit K" }]);
      return Promise.resolve([]);
    });
    renderPage();
    expect(await screen.findByTestId("aparelhos-empty")).toBeInTheDocument();
  });

  it("enquanto /aparelhos aguarda, exibe carregando; depois renderiza a tabela", async () => {
    let carregar: (a: Aparelho[]) => void;
    const pendente = new Promise<Aparelho[]>((r) => {
      carregar = r;
    });
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") return pendente;
      if (url === "/aparelhos/pareamento/kits")
        return Promise.resolve([{ id: 1, nome: "Kit K" }]);
      return Promise.resolve([]);
    });
    renderPage();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    carregar!([
      aparelhoFixture({
        id: 99,
        tipo: "RASTREADOR",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
        identificador: "AGUARDE",
        marca: "MarcaGps",
        modelo: "ModA",
      }),
    ]);
    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
    });
    expect(screen.getByText("AGUARDE")).toBeInTheDocument();
  });

  it("paginação: na segunda página vê o item além de PAGE_SIZE; anterior volta", async () => {
    const user = userEvent.setup();
    const n = PAGE_SIZE + 1;
    apiMock.mockImplementation((url: string) => {
      if (url === "/aparelhos") {
        return Promise.resolve(
          Array.from({ length: n }, (_, i) =>
            aparelhoLinhaContagem(i + 1),
          ) satisfies Aparelho[],
        );
      }
      if (url === "/aparelhos/pareamento/kits")
        return Promise.resolve([{ id: 1, nome: "Kit K" }]);
      return Promise.resolve([]);
    });
    renderPage();
    expect(
      await screen.findByText("N-001", { exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`N-${String(PAGE_SIZE + 1).padStart(3, "0")}`, {
        exact: true,
      }),
    ).not.toBeInTheDocument();
    const next = screen.getByTestId("aparelhos-page-next");
    expect(next).toBeInTheDocument();
    await user.click(next);
    await waitFor(() => {
      expect(
        screen.getByText(`N-${String(PAGE_SIZE + 1).padStart(3, "0")}`, {
          exact: true,
        }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText("N-001", { exact: true }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId("aparelhos-page-prev"));
    await waitFor(() => {
      expect(screen.getByText("N-001", { exact: true })).toBeInTheDocument();
    });
  });

  it("linha expandida some do DOM se o filtro remove esse aparelho", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("aparelho-row-1")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("aparelho-row-1"));
    expect(screen.getByTestId("aparelho-expanded-1")).toBeInTheDocument();
    await user.click(screen.getByTestId("aparelhos-status-configurado"));
    await waitFor(() => {
      expect(screen.queryByTestId("aparelho-expanded-1")).toBeNull();
    });
  });

  it("com permissão de criar, links de cadastro apontam para lote e individual", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("aparelhos-link-lote")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("aparelhos-link-lote")).toHaveAttribute(
      "href",
      "/aparelhos/lote",
    );
    expect(screen.getByTestId("aparelhos-link-individual")).toHaveAttribute(
      "href",
      "/aparelhos/individual",
    );
  });
});
