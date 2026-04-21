import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockLeafletMap = vi.hoisted(() => ({ zoom: 17 }));

const leafletDivIcon = vi.hoisted(() =>
  vi.fn((opts: { html?: string }) => ({
    _type: "divIcon",
    html: opts.html ?? "",
  })),
);

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
    divIcon: leafletDivIcon,
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
    eventHandlers,
  }: {
    children?: React.ReactNode;
    position: [number, number];
    icon: unknown;
    eventHandlers?: { click?: () => void };
  }) => (
    <div
      data-testid="marker"
      data-position={position.join(",")}
      data-icon-type={
        icon && typeof icon === "object" && "_type" in icon
          ? (icon as { _type: string })._type
          : "unknown"
      }
      data-html-snippet={
        icon && typeof icon === "object" && "html" in icon
          ? String((icon as { html: string }).html).slice(0, 200)
          : ""
      }
      role={eventHandlers?.click ? "button" : undefined}
      onClick={() => eventHandlers?.click?.()}
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
  beforeEach(() => {
    leafletDivIcon.mockClear();
    leafletMapSingleton.setView.mockClear();
    leafletMapSingleton.fitBounds.mockClear();
    leafletMapSingleton.invalidateSize.mockClear();
  });

  afterEach(() => {
    mockLeafletMap.zoom = 17;
    vi.useRealTimers();
  });

  it("renderiza apenas técnicos com lat/lng numéricos válidos", () => {
    const tecnicos: TecnicoMapItem[] = [
      makeTecnico({ id: 1, nome: "Carlos" }),
      makeTecnico({
        id: 2,
        nome: "Sem coord",
        latitude: null,
        longitude: null,
      }),
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

  it("chama onMarkerClick ao clicar em marcador individual", async () => {
    const user = userEvent.setup();
    const onMarkerClick = vi.fn();
    mockLeafletMap.zoom = 17;
    render(
      <TecnicosMap
        tecnicos={[makeTecnico({ id: 42, nome: "Zé" })]}
        containerSize="collapsed"
        onMarkerClick={onMarkerClick}
      />,
    );

    const [marker] = screen.getAllByTestId("marker");
    await user.click(marker);

    expect(onMarkerClick).toHaveBeenCalledWith(42);
  });

  it("popup de cluster lista técnicos e Ver na lista chama onMarkerClick", async () => {
    const user = userEvent.setup();
    const onMarkerClick = vi.fn();
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

    render(
      <TecnicosMap
        tecnicos={tecnicos}
        containerSize="collapsed"
        onMarkerClick={onMarkerClick}
      />,
    );

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    const verNaLista = screen.getAllByRole("button", { name: /Ver na lista/i });
    await user.click(verNaLista[0]!);

    expect(onMarkerClick).toHaveBeenCalledWith(1);
  });

  it("cluster misto EXATO+CIDADE usa cor mixed no html do ícone", () => {
    mockLeafletMap.zoom = 4;
    const tecnicos: TecnicoMapItem[] = [
      makeTecnico({ id: 1, nome: "A", geocodingPrecision: "EXATO" }),
      makeTecnico({
        id: 2,
        nome: "B",
        geocodingPrecision: "CIDADE",
        latitude: -23.55,
        longitude: -46.63,
      }),
    ];

    render(<TecnicosMap tecnicos={tecnicos} containerSize="collapsed" />);

    const clusterHtml = leafletDivIcon.mock.calls
      .map((c) => String(c[0]?.html ?? ""))
      .find((h) => h.includes("#475569"));
    expect(clusterHtml).toBeDefined();
  });

  it("geocodingPrecision null trata como EXATO no pin individual", () => {
    mockLeafletMap.zoom = 17;
    render(
      <TecnicosMap
        tecnicos={[makeTecnico({ id: 1, geocodingPrecision: null })]}
        containerSize="collapsed"
      />,
    );

    const pinHtml = leafletDivIcon.mock.calls
      .map((c) => String(c[0]?.html ?? ""))
      .find((h) => h.includes("#2563eb"));
    expect(pinHtml).toBeDefined();
  });

  it("FitToMarkers com zero pontos centraliza Brasil", () => {
    render(<TecnicosMap tecnicos={[]} containerSize="collapsed" />);

    expect(leafletMapSingleton.setView).toHaveBeenCalledWith(
      [-14.235, -51.9253],
      4,
    );
  });

  it("FitToMarkers com um ponto usa zoom 13", () => {
    render(
      <TecnicosMap
        tecnicos={[makeTecnico({ id: 1 })]}
        containerSize="collapsed"
      />,
    );

    expect(leafletMapSingleton.setView).toHaveBeenCalledWith(
      [-23.55, -46.63],
      13,
    );
  });

  it("FitToMarkers com dois pontos distintos chama fitBounds", () => {
    mockLeafletMap.zoom = 17;
    render(
      <TecnicosMap
        tecnicos={[
          makeTecnico({ id: 1, latitude: -23.55, longitude: -46.63 }),
          makeTecnico({
            id: 2,
            nome: "B",
            latitude: -22.9,
            longitude: -43.2,
          }),
        ]}
        containerSize="collapsed"
      />,
    );

    expect(leafletMapSingleton.fitBounds).toHaveBeenCalled();
  });

  it("InvalidateOnResize agenda invalidateSize após mudar containerSize", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <TecnicosMap tecnicos={[]} containerSize="collapsed" />,
    );

    rerender(<TecnicosMap tecnicos={[]} containerSize="fullscreen" />);

    expect(leafletMapSingleton.invalidateSize).not.toHaveBeenCalled();
    vi.advanceTimersByTime(320);
    expect(leafletMapSingleton.invalidateSize).toHaveBeenCalledTimes(1);
  });
});
