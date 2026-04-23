import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EquipamentoTableRow } from "@/pages/equipamentos/lista/components/EquipamentoTableRow";
import type { EquipamentoListItem } from "@/pages/equipamentos/lista/equipamentos-page.shared";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => (
    <span data-icon={name} aria-hidden />
  ),
}));

function equip(overrides: Partial<EquipamentoListItem>): EquipamentoListItem {
  return {
    id: 42,
    tipo: "RASTREADOR",
    status: "CONFIGURADO",
    proprietario: "INFINITY",
    criadoEm: "",
    atualizadoEm: "2020-01-01T12:00:00.000Z",
    identificador: "IMEI-X",
    simVinculado: { id: 1, identificador: "ICCID-X" },
    ...overrides,
  } as EquipamentoListItem;
}

describe("EquipamentoTableRow", () => {
  it("clique na linha alterna expansão", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { rerender } = render(
      <table>
        <tbody>
          <EquipamentoTableRow
            equip={equip({})}
            expanded={false}
            kitsPorId={new Map()}
            onToggleExpand={onToggle}
          />
        </tbody>
      </table>,
    );
    await user.click(screen.getByTestId("equipamento-row-42"));
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <table>
        <tbody>
          <EquipamentoTableRow
            equip={equip({})}
            expanded
            kitsPorId={new Map()}
            onToggleExpand={onToggle}
          />
        </tbody>
      </table>,
    );
    expect(
      screen.getByTestId("equipamento-historico-vazio"),
    ).toBeInTheDocument();
  });

  it("botão de toggle não propaga duplo disparo com clique na linha", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <table>
        <tbody>
          <EquipamentoTableRow
            equip={equip({})}
            expanded={false}
            kitsPorId={new Map()}
            onToggleExpand={onToggle}
          />
        </tbody>
      </table>,
    );
    await user.click(screen.getByTestId("equipamento-row-toggle-42"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("status Em Kit quando CONFIGURADO com kitId", () => {
    render(
      <table>
        <tbody>
          <EquipamentoTableRow
            equip={equip({ kitId: 1, status: "CONFIGURADO" })}
            expanded={false}
            kitsPorId={new Map([[1, "K1"]])}
            onToggleExpand={vi.fn()}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Em Kit")).toBeInTheDocument();
  });
});
