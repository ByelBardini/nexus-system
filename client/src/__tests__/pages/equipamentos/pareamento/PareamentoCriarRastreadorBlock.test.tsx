import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PareamentoCriarRastreadorBlock } from "@/pages/equipamentos/pareamento/components/PareamentoCriarRastreadorBlock";

vi.mock("@/components/ui/select", () => {
  const Passthrough = ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value?: string;
  }) => (
    <div data-testid="mock-select" data-value={value}>
      {children}
    </div>
  );
  return {
    Select: Passthrough,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => <button type="button" data-value={value}>{children}</button>,
  };
});

const base = {
  criarNovo: false,
  onCriarNovoChange: vi.fn(),
  onCriarNovoUnchecked: vi.fn(),
  pertenceLote: false,
  onPertenceLoteChange: vi.fn(),
  loteRastreadorId: "",
  onLoteRastreadorIdChange: vi.fn(),
  loteBusca: "",
  onLoteBuscaChange: vi.fn(),
  lotesFiltrados: [],
  marca: "",
  modelo: "",
  onMarcaChange: vi.fn(),
  onModeloChange: vi.fn(),
  marcasAtivas: [],
  modelosPorMarca: [],
};

describe("PareamentoCriarRastreadorBlock", () => {
  it("variant individual: rótulos 'Marca (se criar novo)' quando criarNovo", () => {
    render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...base}
        criarNovo
      />,
    );
    expect(
      screen.getByText(/marca \(se criar novo\)/i),
    ).toBeInTheDocument();
  });

  it("variant massa: rótulo curto Marca quando criarNovo", () => {
    render(
      <PareamentoCriarRastreadorBlock variant="massa" {...base} criarNovo />,
    );
    expect(screen.getByText(/^marca$/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/marca \(se criar novo\)/i),
    ).not.toBeInTheDocument();
  });

  it("ao desmarcar Criar Novo chama onCriarNovoUnchecked", async () => {
    const onCriarNovoUnchecked = vi.fn();
    render(
      <PareamentoCriarRastreadorBlock
        variant="individual"
        {...base}
        criarNovo
        onCriarNovoUnchecked={onCriarNovoUnchecked}
      />,
    );
    const cb = screen.getByRole("checkbox", { name: /criar novo/i });
    await userEvent.click(cb);
    expect(onCriarNovoUnchecked).toHaveBeenCalledTimes(1);
  });
});
