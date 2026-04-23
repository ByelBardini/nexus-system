import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CadastroLoteFooter } from "@/pages/aparelhos/cadastro-lote/CadastroLoteFooter";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => navigate };
});

describe("CadastroLoteFooter", () => {
  it("registrar desabilitado sem permissão lógica do pai", () => {
    render(
      <MemoryRouter>
        <form>
          <CadastroLoteFooter canCreate={false} podeSalvar isPending={false} />
        </form>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: /Registrar Lote/i }),
    ).toBeDisabled();
  });

  it("Cancelar chama navigate para /aparelhos", async () => {
    const user = userEvent.setup();
    navigate.mockReset();
    render(
      <MemoryRouter>
        <form>
          <CadastroLoteFooter canCreate podeSalvar isPending={false} />
        </form>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: /Cancelar/i }));
    expect(navigate).toHaveBeenCalledWith("/aparelhos");
  });

  it("em pending mostra Registrando e desabilita submit", () => {
    render(
      <MemoryRouter>
        <form>
          <CadastroLoteFooter canCreate podeSalvar isPending />
        </form>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Registrando/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Registrando/i })).toBeDisabled();
  });
});
