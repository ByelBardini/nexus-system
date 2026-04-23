import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TecnicosTableSection } from "@/pages/tecnicos/components/TecnicosTableSection";
import type { Tecnico } from "@/pages/tecnicos/lib/tecnicos.types";

function row(id: number, nome: string, ativo: boolean): Tecnico {
  return {
    id,
    nome,
    cpfCnpj: null,
    telefone: "11999999999",
    cidade: "C",
    estado: "SP",
    cep: null,
    logradouro: "Rua 1",
    numero: null,
    complemento: null,
    bairro: null,
    cidadeEndereco: null,
    estadoEndereco: null,
    latitude: null,
    longitude: null,
    geocodingPrecision: null,
    ativo,
    precos: {
      instalacaoSemBloqueio: 10,
      instalacaoComBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    },
  };
}

describe("TecnicosTableSection", () => {
  it("linha expandida mostra Editar Perfil", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const t = row(1, "Alpha", true);
    render(
      <TecnicosTableSection
        paginated={[t]}
        filteredCount={1}
        expandedId={1}
        onExpandedChange={vi.fn()}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
        canEdit
        onToggleStatus={vi.fn()}
        onEditTecnico={onEdit}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Editar Perfil/i }));
    expect(onEdit).toHaveBeenCalledWith(t);
  });

  it("edge: switch desabilitado sem canEdit", () => {
    const t = row(2, "Beta", true);
    render(
      <TecnicosTableSection
        paginated={[t]}
        filteredCount={1}
        expandedId={null}
        onExpandedChange={vi.fn()}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
        canEdit={false}
        onToggleStatus={vi.fn()}
        onEditTecnico={vi.fn()}
      />,
    );
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("chama onToggleStatus ao alterar switch", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const t = row(3, "Gamma", true);
    render(
      <TecnicosTableSection
        paginated={[t]}
        filteredCount={1}
        expandedId={null}
        onExpandedChange={vi.fn()}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
        canEdit
        onToggleStatus={onToggle}
        onEditTecnico={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith(t);
  });

  it("clique na linha alterna expansão via callback", async () => {
    const user = userEvent.setup();
    const onExpanded = vi.fn();
    const t = row(4, "Delta", true);
    render(
      <TecnicosTableSection
        paginated={[t]}
        filteredCount={1}
        expandedId={null}
        onExpandedChange={onExpanded}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
        canEdit
        onToggleStatus={vi.fn()}
        onEditTecnico={vi.fn()}
      />,
    );
    await user.click(screen.getByText("Delta"));
    expect(onExpanded).toHaveBeenCalledWith(4);
  });
});
