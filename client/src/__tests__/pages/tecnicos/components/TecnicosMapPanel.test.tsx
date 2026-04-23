import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TecnicosMapPanel } from "@/pages/tecnicos/components/TecnicosMapPanel";
import type { Tecnico } from "@/pages/tecnicos/lib/tecnicos.types";

vi.mock("@/components/TecnicosMap", () => ({
  default: () => <div data-testid="map-mock" />,
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

const base: Tecnico = {
  id: 1,
  nome: "M",
  cpfCnpj: null,
  telefone: null,
  cidade: null,
  estado: null,
  cep: null,
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  cidadeEndereco: null,
  estadoEndereco: null,
  latitude: null,
  longitude: null,
  geocodingPrecision: null,
  ativo: true,
};

describe("TecnicosMapPanel", () => {
  it("renderiza mapa lazy mockado após Suspense", async () => {
    const setMap = vi.fn();
    render(
      <TecnicosMapPanel
        tecnicos={[base]}
        mapState="collapsed"
        onMapStateChange={setMap}
      />,
    );
    expect(await screen.findByTestId("map-mock")).toBeInTheDocument();
  });

  it("botão principal chama setState com função (ciclo collapsed → …)", async () => {
    const user = userEvent.setup();
    const setMap = vi.fn();
    render(
      <TecnicosMapPanel
        tecnicos={[]}
        mapState="collapsed"
        onMapStateChange={setMap}
      />,
    );
    const expandBtn = screen.getByTitle("Expandir mapa");
    await user.click(expandBtn);
    expect(setMap).toHaveBeenCalledWith(expect.any(Function));
  });

  it("edge: em expanded mostra botão recolher", () => {
    render(
      <TecnicosMapPanel
        tecnicos={[]}
        mapState="expanded"
        onMapStateChange={vi.fn()}
      />,
    );
    expect(screen.getByTitle("Recolher mapa")).toBeInTheDocument();
  });
});
