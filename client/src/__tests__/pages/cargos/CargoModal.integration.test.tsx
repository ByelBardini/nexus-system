import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CargoModal } from "@/pages/cargos/cargo-modal";
import type { Cargo, Permission, Setor } from "@/types/cargo";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: apiMock,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

const setores: Setor[] = [{ id: 1, code: "ADM", nome: "Admin" }];

const permissoes: Permission[] = [
  { id: 10, code: "ADMINISTRATIVO.CARGO.LISTAR" },
  { id: 11, code: "ADMINISTRATIVO.CARGO.CRIAR" },
];

const cargo: Cargo = {
  id: 5,
  code: "X",
  nome: "Gerente",
  descricao: null,
  categoria: "ADMINISTRATIVO",
  ativo: true,
  setor: setores[0],
  usuariosVinculados: 1,
  cargoPermissoes: [{ permissaoId: 10 }],
};

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CargoModal — fluxo integrado (UI + hook)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("modo criação: título Novo Cargo e resumo sem nome definido", () => {
    const onClose = vi.fn();
    renderWithClient(
      <CargoModal
        open
        cargo={null}
        isNew
        onClose={onClose}
        permissoes={permissoes}
        setores={setores}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /novo cargo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/definir nome/i)).toBeInTheDocument();
  });

  it("modo edição: título Editar Cargo e exibe nome no resumo", () => {
    renderWithClient(
      <CargoModal
        open
        cargo={cargo}
        isNew={false}
        onClose={vi.fn()}
        permissoes={permissoes}
        setores={setores}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /editar cargo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gerente")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("checkbox de ativo só aparece ao editar", () => {
    const { rerender } = renderWithClient(
      <CargoModal
        open
        cargo={null}
        isNew
        onClose={vi.fn()}
        permissoes={permissoes}
        setores={setores}
      />,
    );
    expect(screen.queryByLabelText(/cargo ativo/i)).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <CargoModal
          open
          cargo={cargo}
          isNew={false}
          onClose={vi.fn()}
          permissoes={permissoes}
          setores={setores}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText(/cargo ativo/i)).toBeInTheDocument();
  });

  it("alternar permissão na matriz atualiza contador no resumo", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <CargoModal
        open
        cargo={cargo}
        isNew={false}
        onClose={vi.fn()}
        permissoes={permissoes}
        setores={setores}
      />,
    );

    const table = screen.getByRole("table");
    const buttons = within(table).getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText("01")).toBeInTheDocument();
    await user.click(buttons[1]);
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("Salvar com nome vazio exibe toast e não chama API", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <CargoModal
        open
        cargo={null}
        isNew
        onClose={vi.fn()}
        permissoes={permissoes}
        setores={setores}
      />,
    );

    const nomeInput = screen.getByPlaceholderText(/operador logístico/i);
    await user.clear(nomeInput);

    await user.click(screen.getByRole("button", { name: /salvar cargo/i }));
    expect(toast.error).toHaveBeenCalledWith("Nome do cargo é obrigatório");
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("criação bem-sucedida chama API, toast e onClose", async () => {
    const user = userEvent.setup();
    apiMock.mockResolvedValueOnce({ id: 42 }).mockResolvedValueOnce(undefined);

    const onClose = vi.fn();
    renderWithClient(
      <CargoModal
        open
        cargo={null}
        isNew
        onClose={onClose}
        permissoes={permissoes}
        setores={setores}
      />,
    );

    await user.type(screen.getByPlaceholderText(/operador logístico/i), "Novo");
    await user.click(screen.getByRole("button", { name: /salvar cargo/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Cargo criado com sucesso");
    expect(apiMock).toHaveBeenCalled();
  });
});
