import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CargoModalFooter } from "@/pages/cargos/cargo-modal/CargoModalFooter";
import { CargoModalHeaderForm } from "@/pages/cargos/cargo-modal/CargoModalHeaderForm";
import { CargoModalSummary } from "@/pages/cargos/cargo-modal/CargoModalSummary";
import { CargoPermissionMatrix } from "@/pages/cargos/cargo-modal/CargoPermissionMatrix";
import { agruparPermissoes } from "@/pages/cargos/cargo-modal/permissionMatrix";
import type { Permission } from "@/types/cargo";

describe("CargoModalHeaderForm", () => {
  it("oculta checkbox de ativo em modo criação", () => {
    render(
      <CargoModalHeaderForm
        isNew
        nome=""
        descricao=""
        categoria="OPERACIONAL"
        ativo
        onNomeChange={vi.fn()}
        onDescricaoChange={vi.fn()}
        onCategoriaChange={vi.fn()}
        onAtivoChange={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText(/cargo ativo/i)).not.toBeInTheDocument();
  });

  it("exibe checkbox de ativo ao editar", () => {
    render(
      <CargoModalHeaderForm
        isNew={false}
        nome="X"
        descricao=""
        categoria="GESTAO"
        ativo={false}
        onNomeChange={vi.fn()}
        onDescricaoChange={vi.fn()}
        onCategoriaChange={vi.fn()}
        onAtivoChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/cargo ativo/i)).toBeInTheDocument();
  });
});

describe("CargoModalSummary", () => {
  it("mostra placeholder quando nome vazio e lista permissões", () => {
    render(
      <CargoModalSummary
        nome=""
        categoria="ADMINISTRATIVO"
        permissoesAtivas={["Visualizar Cargos"]}
        selectedCount={1}
      />,
    );
    expect(screen.getByText(/definir nome/i)).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText(/visualizar cargos/i)).toBeInTheDocument();
  });

  it("edge: mais de 10 permissões exibe continuação", () => {
    const many = Array.from({ length: 12 }, (_, i) => `Perm ${i}`);
    render(
      <CargoModalSummary
        nome="A"
        categoria="OPERACIONAL"
        permissoesAtivas={many}
        selectedCount={12}
      />,
    );
    expect(screen.getByText(/\+ 2 permissões/i)).toBeInTheDocument();
  });
});

describe("CargoModalFooter", () => {
  it("desabilita botões quando isPending", () => {
    render(
      <CargoModalFooter onClose={vi.fn()} onSave={vi.fn()} isPending />,
    );
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /salvando/i })).toBeDisabled();
  });
});

describe("CargoPermissionMatrix", () => {
  it("colapsa setor ao clicar no cabeçalho", async () => {
    const user = userEvent.setup();
    const perms: Permission[] = [
      { id: 1, code: "ADMINISTRATIVO.CARGO.LISTAR" },
      { id: 2, code: "ADMINISTRATIVO.CARGO.CRIAR" },
    ];
    const estrutura = agruparPermissoes(perms);
    const onToggleSector = vi.fn();
    const { container } = render(
      <CargoPermissionMatrix
        estrutura={estrutura}
        expandedSectors={["ADMINISTRATIVO"]}
        selectedPermIds={[]}
        onToggleSectorExpanded={onToggleSector}
        onToggleAllSectorPermissions={vi.fn()}
        isSectorFullySelected={() => false}
        onTogglePermission={vi.fn()}
      />,
    );
    expect(container.querySelector("table")).toBeInTheDocument();

    await user.click(screen.getByText(/administrativo/i));
    expect(onToggleSector).toHaveBeenCalledWith("ADMINISTRATIVO");
  });
});
