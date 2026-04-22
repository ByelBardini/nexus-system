import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EquipamentoExpandedPanel } from "@/pages/equipamentos/lista/components/EquipamentoExpandedPanel";
import type { EquipamentoListItem } from "@/pages/equipamentos/lista/equipamentos-page.shared";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => null,
}));

function equip(overrides: Partial<EquipamentoListItem>): EquipamentoListItem {
  return {
    id: 1,
    tipo: "RASTREADOR",
    status: "CONFIGURADO",
    proprietario: "INFINITY",
    criadoEm: "",
    atualizadoEm: "2020-01-01T12:00:00.000Z",
    simVinculado: { id: 1, identificador: "ICCID" },
    ...overrides,
  } as EquipamentoListItem;
}

describe("EquipamentoExpandedPanel", () => {
  it("mostra mensagem quando não há histórico", () => {
    render(
      <table>
        <tbody>
          <EquipamentoExpandedPanel
            equip={equip({ historico: [] })}
            kitsPorId={new Map()}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByTestId("equipamento-historico-vazio")).toBeInTheDocument();
  });

  it("renderiza itens de histórico", () => {
    render(
      <table>
        <tbody>
          <EquipamentoExpandedPanel
            equip={equip({
              historico: [
                {
                  statusAnterior: "EM_ESTOQUE",
                  statusNovo: "CONFIGURADO",
                  criadoEm: "2020-01-02T12:00:00.000Z",
                },
              ],
            })}
            kitsPorId={new Map([[1, "K"]])}
          />
        </tbody>
      </table>,
    );
    const hist = screen.getByTestId("equipamento-historico");
    expect(hist).toBeInTheDocument();
    expect(within(hist).getByText("Configurado")).toBeInTheDocument();
  });

  it("edge: kit resolve pelo mapa quando kit embutido ausente", () => {
    render(
      <table>
        <tbody>
          <EquipamentoExpandedPanel
            equip={equip({ kitId: 7, kit: undefined })}
            kitsPorId={new Map([[7, "Kit Mapa"]])}
          />
        </tbody>
      </table>,
    );
    expect(screen.getAllByText("Kit Mapa").length).toBeGreaterThanOrEqual(1);
  });
});
