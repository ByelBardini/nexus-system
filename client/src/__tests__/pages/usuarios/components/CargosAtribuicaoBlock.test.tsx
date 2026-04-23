import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CargosAtribuicaoBlock } from "@/pages/usuarios/components/CargosAtribuicaoBlock";
import { cargoComPermissoesFixture } from "../fixtures";

describe("CargosAtribuicaoBlock", () => {
  const cargoA = cargoComPermissoesFixture(1, "Setor A", [
    "X.Y.LISTAR",
  ]);
  const onToggle = vi.fn();
  const onToggleShow = vi.fn();

  beforeEach(() => {
    onToggle.mockClear();
    onToggleShow.mockClear();
  });

  it("mostra vazio e rótulo customizado de chips", () => {
    render(
      <CargosAtribuicaoBlock
        selectedRoleIds={[]}
        cargosComPermissoes={[cargoA]}
        cargosPorSetor={{}}
        showSelector={false}
        onToggleShowSelector={onToggleShow}
        onToggleRole={onToggle}
        chipsLabel="Meus Cargos"
      />,
    );
    expect(screen.getByText("Meus Cargos")).toBeInTheDocument();
    expect(
      screen.getByText(/nenhum cargo selecionado/i),
    ).toBeInTheDocument();
  });

  it("chips: remove e botão de expansão", async () => {
    const user = userEvent.setup();
    render(
      <CargosAtribuicaoBlock
        selectedRoleIds={[1]}
        cargosComPermissoes={[cargoA]}
        cargosPorSetor={{ "Setor A": [cargoA] }}
        showSelector={false}
        onToggleShowSelector={onToggleShow}
        onToggleRole={onToggle}
        chipsLabel="Cargos"
      />,
    );
    expect(screen.getByText("Cargo 1")).toBeInTheDocument();
    const close = screen.getByRole("button", { name: /close/i });
    await user.click(close);
    expect(onToggle).toHaveBeenCalledWith(1);
    const expandBtn = screen.getByRole("button", {
      name: /selecionar cargos/i,
    });
    await user.click(expandBtn);
    expect(onToggleShow).toHaveBeenCalled();
  });

  it("setor: clique no cargo seleciona", async () => {
    const user = userEvent.setup();
    render(
      <CargosAtribuicaoBlock
        selectedRoleIds={[]}
        cargosComPermissoes={[cargoA]}
        cargosPorSetor={{ "Setor A": [cargoA] }}
        showSelector
        onToggleShowSelector={onToggleShow}
        onToggleRole={onToggle}
        chipsLabel="Cargos"
      />,
    );
    await user.click(await screen.findByText("Cargo 1"));
    expect(onToggle).toHaveBeenCalledWith(1);
  });
});
