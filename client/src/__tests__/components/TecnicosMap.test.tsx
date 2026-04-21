import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockLeafletMap = vi.hoisted(() => ({ zoom: 17 }));

const leafletMapSingleton = vi.hoisted(() => ({
  setView: vi.fn(),
  fitBounds: vi.fn(),
  invalidateSize: vi.fn(),
  getZoom: () => mockLeafletMap.zoom,
  getBounds: () => ({
    getWest: () => -180,
    getSouth: () => -85,
    getEast: () => 180,
    getNorth: () => 85,
  }),
  whenReady: (cb: () => void) => {
    cb();
  },
  on: vi.fn(),
  off: vi.fn(),
}));

vi.mock("leaflet/dist/leaflet.css", () => ({}));

vi.mock("leaflet", () => ({
  default: {
    divIcon: vi.fn(() => ({ _type: "divIcon" })),
    latLngBounds: vi.fn(() => ({})),
  },
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({
    children,
    position,
    icon,
  }: {
    children?: React.ReactNode;
    position: [number, number];
    icon: unknown;
  }) => (
    <div
      data-testid="marker"
      data-position={position.join(",")}
      data-icon-type={
        icon && typeof icon === "object" && "_type" in icon
          ? (icon as { _type: string })._type
          : "unknown"
      }
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => leafletMapSingleton,
}));

import { TecnicosMap, type TecnicoMapItem } from "@/components/TecnicosMap";

function makeTecnico(overrides: Partial<TecnicoMapItem>): TecnicoMapItem {
  return {
    id: 1,
    nome: "Carlos",
    cidadeEndereco: "São Paulo",
    estadoEndereco: "SP",
    latitude: -23.55,
    longitude: -46.63,
    geocodingPrecision: "EXATO",
    ...overrides,
  };
}

describe("TecnicosMap", () => {
  afterEach(() => {
    mockLeafletMap.zoom = 17;
  });

  it("renderiza apenas técnicos com lat/lng numéricos válidos", () => {
    const tecnicos: TecnicoMapItem[] = [
      makeTecnico({ id: 1, nome: "Carlos" }),
      makeTecnico({ id: 2, nome: "Sem coord", latitude: null, longitude: null }),
      makeTecnico({ id: 3, nome: "Inválido", latitude: 999, longitude: 0 }),
      makeTecnico({
        id: 4,
        nome: "String",
        latitude: "-22.9" as unknown as number,
        longitude: "-43.2" as unknown as number,
      }),
    ];

    render(<TecnicosMap tecnicos={tecnicos} containerSize="collapsed" />);

    const markers = screen.getAllByTestId("marker");
    expect(markers).toHaveLength(2);
    expect(markers[0].getAttribute("data-position")).toBe("-23.55,-46.63");
    expect(markers[1].getAttribute("data-position")).toBe("-22.9,-43.2");
  });

  it("usa divIcon personalizado em todos os marcadores (sem PNG padrão do Leaflet)", () => {
    const tecnicos: TecnicoMapItem[] = [
      makeTecnico({ id: 1, geocodingPrecision: "EXATO" }),
      makeTecnico({
        id: 2,
        geocodingPrecision: "CIDADE",
        latitude: -22.9,
        longitude: -43.2,
      }),
    ];

    render(<TecnicosMap tecnicos={tecnicos} containerSize="collapsed" />);

    const markers = screen.getAllByTestId("marker");
    expect(markers[0].getAttribute("data-icon-type")).toBe("divIcon");
    expect(markers[1].getAttribute("data-icon-type")).toBe("divIcon");
  });

  it("mostra aviso de localização aproximada no popup quando precision=CIDADE", () => {
    render(
      <TecnicosMap
        tecnicos={[
          makeTecnico({ id: 1, nome: "Bahiano", geocodingPrecision: "CIDADE" }),
        ]}
        containerSize="collapsed"
      />,
    );

    expect(screen.getByText(/Localização aproximada/i)).toBeInTheDocument();
  });

  it("não renderiza nenhum marker quando lista está vazia", () => {
    render(<TecnicosMap tecnicos={[]} containerSize="collapsed" />);
    expect(screen.queryAllByTestId("marker")).toHaveLength(0);
  });

  it("com zoom afastado, mesma coordenada vira um único marcador agrupado", () => {
    mockLeafletMap.zoom = 4;
    const tecnicos: TecnicoMapItem[] = [
      makeTecnico({ id: 1, nome: "Ana" }),
      makeTecnico({
        id: 2,
        nome: "Bruno",
        latitude: -23.55,
        longitude: -46.63,
      }),
    ];

    render(<TecnicosMap tecnicos={tecnicos} containerSize="collapsed" />);

    expect(screen.getAllByTestId("marker")).toHaveLength(1);
  });
});
