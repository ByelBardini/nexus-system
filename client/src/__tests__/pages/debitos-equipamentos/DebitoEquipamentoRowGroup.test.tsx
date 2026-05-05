import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DebitoEquipamentoRowGroup } from "@/pages/debitos-equipamentos/components/DebitoEquipamentoRowGroup";
import { mapDebitoApiToView } from "@/pages/debitos-equipamentos/domain/mapDebitoApiToView";
import { buildDebitoRastreadorListaApi } from "./debitos-equipamentos.fixtures";

describe("DebitoEquipamentoRowGroup", () => {
  it("histórico vazio mostra mensagem ao expandir", () => {
    const debito = mapDebitoApiToView(buildDebitoRastreadorListaApi());
    render(
      <table>
        <tbody>
          <DebitoEquipamentoRowGroup
            debito={debito}
            isExpanded
            onToggle={vi.fn()}
          />
        </tbody>
      </table>,
    );
    expect(
      screen.getByText("Nenhuma movimentação registrada."),
    ).toBeInTheDocument();
  });

  it("stopPropagation no botão de menu não dispara onToggle duas vezes", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const debito = mapDebitoApiToView(buildDebitoRastreadorListaApi());
    render(
      <table>
        <tbody>
          <DebitoEquipamentoRowGroup
            debito={debito}
            isExpanded={false}
            onToggle={onToggle}
          />
        </tbody>
      </table>,
    );
    const menuBtn = screen.getAllByRole("button")[0];
    await user.click(menuBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
