/**
 * Vitest + RTL: fluxo da página de usuários com API mockada.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UsuariosPage } from "@/pages/usuarios/UsuariosPage";
import {
  paginatedUsuariosFixture,
  usuarioListItemFixture,
  cargoComPermissoesFixture,
} from "./fixtures";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasPermission: (code: string) =>
      code === "ADMINISTRATIVO.USUARIO.CRIAR" ||
      code === "ADMINISTRATIVO.USUARIO.EDITAR",
    user: { id: 99, nome: "Admin", email: "a@a.com" },
  }),
}));

function renderUsuariosPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={["/usuarios"]}>
      <QueryClientProvider client={qc}>
        <Routes>
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

const permissoesPadrao = [
  { id: 1, code: "A" },
  { id: 2, code: "B" },
];

function mockLista(
  u = usuarioListItemFixture(),
  ...extra: ReturnType<typeof usuarioListItemFixture>[]
) {
  api.mockImplementation((path: string) => {
    if (String(path).includes("/users/paginated"))
      return Promise.resolve(paginatedUsuariosFixture([u, ...extra]));
    if (path === "/roles/permissions")
      return Promise.resolve(permissoesPadrao);
    if (String(path).includes("/roles?includePermissions"))
      return Promise.resolve([
        cargoComPermissoesFixture(1, "Adm", [
          "AGENDAMENTO.OS.LISTAR",
          "AGENDAMENTO.OS.EXCLUIR",
        ]),
      ]);
    return Promise.resolve(null);
  });
}

beforeEach(() => {
  api.mockReset();
});

describe("UsuariosPage E2E (cliente)", () => {
  it("renderiza cabeçalho e tabela após carregar", async () => {
    mockLista();
    renderUsuariosPage();
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /usuários & segurança/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Ana Teste")).toBeInTheDocument();
    expect(screen.getByText(/total de 1 usuários cadastrados/i)).toBeInTheDocument();
  });

  it("vazio: mensagem nenhum usuário", async () => {
    api.mockImplementation((path: string) => {
      if (String(path).includes("/users/paginated"))
        return Promise.resolve(
          paginatedUsuariosFixture([], { total: 0, page: 1, totalPages: 0 }),
        );
      if (path === "/roles/permissions") return Promise.resolve(permissoesPadrao);
      return Promise.resolve(null);
    });
    renderUsuariosPage();
    await waitFor(() =>
      expect(
        screen.getByText(/nenhum usuário encontrado/i),
      ).toBeInTheDocument(),
    );
  });

  it("edge: inativo exibe inativo e linha com estilo; expande detalhe", async () => {
    const u = usuarioListItemFixture({ ativo: false, nome: "Z Inativo" });
    mockLista(u);
    const user = userEvent.setup();
    renderUsuariosPage();
    await screen.findByText("Z Inativo");
    const row = screen.getByText("Z Inativo").closest("tr");
    expect(
      within(row!).getByText("Inativo", { exact: true }),
    ).toBeInTheDocument();
    await user.click(screen.getByText("Z Inativo"));
    expect(
      await screen.findByText(/audit trail & segurança/i),
    ).toBeInTheDocument();
  });

  it("fluxo: abre Novo Usuário e envia criação com roles", async () => {
    mockLista();
    const user = userEvent.setup();
    renderUsuariosPage();
    await screen.findByText("Ana Teste");
    await user.click(
      screen.getByRole("button", { name: /novo usuário/i }),
    );
    const dialog = await screen.findByRole("dialog");
    const nome = within(dialog).getByPlaceholderText(/ricardo cavalcanti/i);
    await user.clear(nome);
    await user.type(nome, "Novo Colab");
    const email = within(dialog).getByPlaceholderText(/usuario@empresa\.com\.br/i);
    await user.clear(email);
    await user.type(email, "n@c.com");
    await user.click(
      within(dialog).getByRole("button", { name: /selecionar cargos/i }),
    );
    const cargo1 = within(dialog).getByRole("button", { name: /cargo 1/i });
    await user.click(cargo1);
    await user.click(
      within(dialog).getByRole("button", { name: /criar usuário/i }),
    );
    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const postCall = api.mock.calls.find(
      (c) => c[0] === "/users" && (c[1] as { method: string })?.method === "POST",
    );
    expect(postCall?.[1] && JSON.parse((postCall[1] as { body: string }).body).nome).toBe(
      "Novo Colab",
    );
  });

  it("fluxo: editar a partir do painel expandido (reset senha e PATCH inativar fora de escopo mínimo)", async () => {
    mockLista();
    const user = userEvent.setup();
    renderUsuariosPage();
    await screen.findByText("Ana Teste");
    await user.click(screen.getByText("Ana Teste"));
    const editBtn = await screen.findByRole("button", {
      name: /editar usuário/i,
    });
    await user.click(editBtn);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByText(/editar usuário/i).length).toBeGreaterThan(0);
    await user.click(
      within(dialog).getByRole("button", { name: /confirmar edição/i }),
    );
    await waitFor(() => {
      expect(api).toHaveBeenCalledWith(
        "/users/1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("não inativa o próprio usuário logado (botão ausente)", async () => {
    const selfUser = usuarioListItemFixture({ id: 99, nome: "Eu" });
    mockLista(selfUser);
    const user = userEvent.setup();
    renderUsuariosPage();
    await screen.findByText("Eu");
    await user.click(screen.getByText("Eu"));
    expect(
      screen.queryByRole("button", { name: /inativar usuário/i }),
    ).not.toBeInTheDocument();
  });
});
