import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EquipamentosPipelineStrip } from "@/pages/equipamentos/lista/components/EquipamentosPipelineStrip";

const counts = {
  total: 10,
  configurados: 2,
  emKit: 3,
  despachados: 1,
  comTecnico: 1,
  instalados: 3,
};

describe("EquipamentosPipelineStrip", () => {
  it("renderiza 6 estágios com contagens", () => {
    const onClick = vi.fn();
    render(
      <EquipamentosPipelineStrip
        pipelineFilter="TODOS"
        pipelineCounts={counts}
        onStageClick={onClick}
      />,
    );
    expect(screen.getByTestId("equipamentos-pipeline-strip")).toBeInTheDocument();
    expect(screen.getByTestId("equipamentos-pipeline-TODOS")).toHaveTextContent("10");
    expect(screen.getByTestId("equipamentos-pipeline-CONFIGURADO")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("equipamentos-pipeline-INSTALADO")).toHaveTextContent(
      "3",
    );
  });

  it("chama onStageClick com o filtro correto", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EquipamentosPipelineStrip
        pipelineFilter="TODOS"
        pipelineCounts={counts}
        onStageClick={onClick}
      />,
    );
    await user.click(screen.getByTestId("equipamentos-pipeline-EM_KIT"));
    expect(onClick).toHaveBeenCalledWith("EM_KIT");
  });

  it("edge: contagens zero ainda renderizam botões clicáveis", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const zeros = {
      total: 0,
      configurados: 0,
      emKit: 0,
      despachados: 0,
      comTecnico: 0,
      instalados: 0,
    };
    render(
      <EquipamentosPipelineStrip
        pipelineFilter="DESPACHADO"
        pipelineCounts={zeros}
        onStageClick={onClick}
      />,
    );
    await user.click(screen.getByTestId("equipamentos-pipeline-TODOS"));
    expect(onClick).toHaveBeenCalledWith("TODOS");
  });
});
