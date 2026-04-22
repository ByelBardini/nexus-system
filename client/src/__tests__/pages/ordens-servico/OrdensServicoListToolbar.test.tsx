import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { OrdensServicoListToolbar } from "@/pages/ordens-servico/lista/components/OrdensServicoListToolbar";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

describe("OrdensServicoListToolbar", () => {
  it("atualiza busca (controlado como na página)", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    function Harness() {
      const [search, setSearch] = useState("");
      return (
        <MemoryRouter>
          <OrdensServicoListToolbar
            search={search}
            onSearchChange={(v) => {
              onSearch(v);
              setSearch(v);
            }}
            statusFilter="TODOS"
            onStatusFilterChange={vi.fn()}
            canCreate={false}
          />
        </MemoryRouter>
      );
    }
    render(<Harness />);
    await user.type(screen.getByTestId("ordens-servico-busca-input"), "abc");
    expect(onSearch.mock.calls.at(-1)?.[0]).toBe("abc");
    expect(screen.getByTestId("ordens-servico-busca-input")).toHaveValue("abc");
  });

  it("Nova OS navega quando canCreate", async () => {
    const user = userEvent.setup();
    mockNavigate.mockClear();
    render(
      <MemoryRouter>
        <OrdensServicoListToolbar
          search=""
          onSearchChange={vi.fn()}
          statusFilter="TODOS"
          onStatusFilterChange={vi.fn()}
          canCreate
        />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId("ordens-servico-btn-nova"));
    expect(mockNavigate).toHaveBeenCalledWith("/ordens-servico/nova");
  });

  it("edge: oculta Nova OS sem permissão", () => {
    render(
      <MemoryRouter>
        <OrdensServicoListToolbar
          search=""
          onSearchChange={vi.fn()}
          statusFilter="TODOS"
          onStatusFilterChange={vi.fn()}
          canCreate={false}
        />
      </MemoryRouter>,
    );
    expect(
      screen.queryByTestId("ordens-servico-btn-nova"),
    ).not.toBeInTheDocument();
  });
});
