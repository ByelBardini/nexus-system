import { memo, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildTecnicoSupercluster,
  geoPointFeatureToPlot,
  isClusterFeature,
  type TecnicoPlotClusterInput,
} from "@/lib/tecnico-map-cluster";
import {
  escapeHtmlForMarker,
  initialFromNome,
} from "@/lib/tecnico-map-marker-html";
import { spreadDuplicateMapCoordinates } from "@/lib/tecnico-map-spread";

type TecnicoPlot = TecnicoPlotClusterInput;

type TecnicoPlotPlaced = TecnicoPlot & {
  displayLat: number;
  displayLng: number;
};

export interface TecnicoMapItem {
  id: number;
  nome: string;
  cidadeEndereco?: string | null;
  estadoEndereco?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  geocodingPrecision?: "EXATO" | "CIDADE" | null;
}

export type MapContainerSize = "collapsed" | "expanded" | "fullscreen";

interface TecnicosMapProps {
  tecnicos: TecnicoMapItem[];
  containerSize: MapContainerSize;
  onMarkerClick?: (id: number) => void;
}

const BRASIL_CENTER: [number, number] = [-14.235, -51.9253];
const BRASIL_ZOOM = 4;

function toPlot(t: TecnicoMapItem): TecnicoPlot | null {
  const lat = t.latitude == null ? NaN : Number(t.latitude);
  const lng = t.longitude == null ? NaN : Number(t.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const precision = t.geocodingPrecision === "CIDADE" ? "CIDADE" : "EXATO";
  return {
    id: t.id,
    nome: t.nome,
    cidadeEndereco: t.cidadeEndereco ?? null,
    estadoEndereco: t.estadoEndereco ?? null,
    lat,
    lng,
    precision,
  };
}

function createTecnicoDivIcon(
  nome: string,
  precision: "EXATO" | "CIDADE",
): L.DivIcon {
  const letter = escapeHtmlForMarker(initialFromNome(nome));
  const isCidade = precision === "CIDADE";
  const bg = isCidade ? "#f59e0b" : "#2563eb";
  const border = isCidade ? "3px dashed #92400e" : "2px solid #ffffff";
  const ring = isCidade
    ? "box-shadow: 0 2px 8px rgba(0,0,0,0.35);"
    : "box-shadow: 0 2px 8px rgba(37,99,235,0.45);";
  const badgeWrench = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;

  return L.divIcon({
    className: "tecnico-marker-div",
    html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="width:36px;height:36px;border-radius:50%;background:${bg};border:${border};${ring}display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;font-family:system-ui,-apple-system,sans-serif;line-height:1;letter-spacing:-0.02em;">${letter}</div>
      <div style="position:absolute;bottom:-1px;right:-1px;width:18px;height:18px;border-radius:50%;background:rgba(15,23,42,0.85);display:flex;align-items:center;justify-content:center;border:2px solid #fff;${ring}">${badgeWrench}</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

function clusterPrecisionStyle(
  group: TecnicoPlot[],
): "CIDADE" | "EXATO" | "mixed" {
  const set = new Set(group.map((g) => g.precision));
  if (set.size === 1) return set.has("CIDADE") ? "CIDADE" : "EXATO";
  return "mixed";
}

function createClusterDivIcon(
  count: number,
  style: "CIDADE" | "EXATO" | "mixed",
): L.DivIcon {
  const bg =
    style === "CIDADE" ? "#f59e0b" : style === "EXATO" ? "#2563eb" : "#475569";
  const border =
    style === "CIDADE"
      ? "3px dashed #92400e"
      : style === "EXATO"
        ? "2px solid #ffffff"
        : "2px solid #e2e8f0";
  const ring =
    style === "EXATO"
      ? "box-shadow: 0 2px 10px rgba(37,99,235,0.5);"
      : "box-shadow: 0 2px 10px rgba(0,0,0,0.35);";
  const label = escapeHtmlForMarker(String(count));
  const badgeWrench = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;

  return L.divIcon({
    className: "tecnico-marker-div",
    html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <div style="width:40px;height:40px;border-radius:50%;background:${bg};border:${border};${ring}display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;font-family:system-ui,-apple-system,sans-serif;line-height:1;">${label}</div>
      <div style="position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-radius:50%;background:rgba(15,23,42,0.9);display:flex;align-items:center;justify-content:center;border:2px solid #fff;${ring}">${badgeWrench}</div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
}

function FitToMarkers({ boundsPoints }: { boundsPoints: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (boundsPoints.length === 0) {
      map.setView(BRASIL_CENTER, BRASIL_ZOOM);
      return;
    }
    if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40] });
  }, [boundsPoints, map]);
  return null;
}

function InvalidateOnResize({ size }: { size: MapContainerSize }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 320);
    return () => clearTimeout(t);
  }, [size, map]);
  return null;
}

function TecnicoMarker({
  plot,
  onMarkerClick,
}: {
  plot: TecnicoPlotPlaced;
  onMarkerClick?: (id: number) => void;
}) {
  const icon = useMemo(
    () => createTecnicoDivIcon(plot.nome, plot.precision),
    [plot.nome, plot.precision],
  );

  return (
    <Marker
      position={[plot.displayLat, plot.displayLng]}
      icon={icon}
      eventHandlers={
        onMarkerClick ? { click: () => onMarkerClick(plot.id) } : undefined
      }
    >
      <Popup>
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800">{plot.nome}</p>
          <p className="text-xs text-slate-600">
            {plot.cidadeEndereco && plot.estadoEndereco
              ? `${plot.cidadeEndereco} / ${plot.estadoEndereco}`
              : "—"}
          </p>
          {plot.precision === "CIDADE" && (
            <p className="text-[10px] text-amber-700 italic">
              Localização aproximada (centro da cidade)
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

function ClusterMarker({
  position,
  group,
  onMarkerClick,
}: {
  position: [number, number];
  group: TecnicoPlot[];
  onMarkerClick?: (id: number) => void;
}) {
  const style = clusterPrecisionStyle(group);
  const icon = useMemo(
    () => createClusterDivIcon(group.length, style),
    [group.length, style],
  );

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="max-w-[240px] space-y-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">
            {group.length} técnicos nesta área
          </p>
          <ul className="space-y-2 border-t border-slate-200 pt-2">
            {group.map((g) => (
              <li
                key={g.id}
                className="border-b border-slate-100 pb-2 last:border-0 last:pb-0"
              >
                <p className="text-sm font-bold text-slate-800">{g.nome}</p>
                <p className="text-xs text-slate-600">
                  {g.cidadeEndereco && g.estadoEndereco
                    ? `${g.cidadeEndereco} / ${g.estadoEndereco}`
                    : "—"}
                </p>
                {g.precision === "CIDADE" && (
                  <p className="text-[10px] text-amber-700 italic">
                    Localização aproximada (centro da cidade)
                  </p>
                )}
                {onMarkerClick ? (
                  <button
                    type="button"
                    className="mt-1 text-[10px] font-bold uppercase text-erp-blue hover:underline"
                    onClick={() => onMarkerClick(g.id)}
                  >
                    Ver na lista
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-500">
            Aproxime o zoom para ver cada pin separado.
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

function MapClusterMarkers({
  plotsRaw,
  onMarkerClick,
}: {
  plotsRaw: TecnicoPlot[];
  onMarkerClick?: (id: number) => void;
}) {
  const map = useMap();
  const [view, setView] = useState<{
    bbox: [number, number, number, number];
    zoom: number;
  } | null>(null);

  const index = useMemo(() => buildTecnicoSupercluster(plotsRaw), [plotsRaw]);

  useEffect(() => {
    const update = () => {
      const b = map.getBounds();
      setView({
        bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        zoom: map.getZoom(),
      });
    };
    const attach = () => {
      update();
      map.on("moveend", update);
      map.on("zoomend", update);
    };
    map.whenReady(attach);
    return () => {
      map.off("moveend", update);
      map.off("zoomend", update);
    };
  }, [map]);

  const { clusters, spreadPlots } = useMemo(() => {
    if (!view || plotsRaw.length === 0) {
      return {
        clusters: [] as {
          key: string;
          position: [number, number];
          group: TecnicoPlot[];
        }[],
        spreadPlots: [] as TecnicoPlotPlaced[],
      };
    }
    const z = Math.floor(view.zoom);
    const rawFeatures = index.getClusters(view.bbox, z);
    const clusterOut: {
      key: string;
      position: [number, number];
      group: TecnicoPlot[];
    }[] = [];
    const pointPlots: TecnicoPlot[] = [];

    for (const f of rawFeatures) {
      if (isClusterFeature(f)) {
        const [lng, lat] = f.geometry.coordinates;
        const leaves = index.getLeaves(f.properties.cluster_id, Infinity, 0);
        const group = leaves.map((leaf) =>
          geoPointFeatureToPlot(leaf as GeoJSON.Feature<GeoJSON.Point>),
        );
        clusterOut.push({
          key: `c-${f.properties.cluster_id}`,
          position: [lat, lng],
          group,
        });
      } else {
        pointPlots.push(
          geoPointFeatureToPlot(f as GeoJSON.Feature<GeoJSON.Point>),
        );
      }
    }

    return {
      clusters: clusterOut,
      spreadPlots: spreadDuplicateMapCoordinates(pointPlots, 48),
    };
  }, [index, view, plotsRaw]);

  return (
    <>
      {clusters.map((c) => (
        <ClusterMarker
          key={c.key}
          position={c.position}
          group={c.group}
          onMarkerClick={onMarkerClick}
        />
      ))}
      {spreadPlots.map((p) => (
        <TecnicoMarker key={p.id} plot={p} onMarkerClick={onMarkerClick} />
      ))}
    </>
  );
}

function TecnicosMapImpl({
  tecnicos,
  containerSize,
  onMarkerClick,
}: TecnicosMapProps) {
  const plotsRaw = useMemo(
    () => tecnicos.map(toPlot).filter((p): p is TecnicoPlot => p !== null),
    [tecnicos],
  );

  const boundsPoints = useMemo(
    () => plotsRaw.map((p) => [p.lat, p.lng] as [number, number]),
    [plotsRaw],
  );

  return (
    <MapContainer
      center={BRASIL_CENTER}
      zoom={BRASIL_ZOOM}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers boundsPoints={boundsPoints} />
      <InvalidateOnResize size={containerSize} />
      <MapClusterMarkers plotsRaw={plotsRaw} onMarkerClick={onMarkerClick} />
    </MapContainer>
  );
}

export const TecnicosMap = memo(TecnicosMapImpl);

export default TecnicosMap;
