import Supercluster from "supercluster";

export type TecnicoPlotClusterInput = {
  id: number;
  nome: string;
  cidadeEndereco: string | null;
  estadoEndereco: string | null;
  lat: number;
  lng: number;
  precision: "EXATO" | "CIDADE";
};

export type TecnicoPlotClusterProps = Omit<
  TecnicoPlotClusterInput,
  "lat" | "lng"
>;

export function buildTecnicoSupercluster(plots: TecnicoPlotClusterInput[]) {
  return new Supercluster<TecnicoPlotClusterProps>({
    radius: 56,
    maxZoom: 16,
    minPoints: 2,
  }).load(
    plots.map((p) => ({
      type: "Feature" as const,
      properties: {
        id: p.id,
        nome: p.nome,
        cidadeEndereco: p.cidadeEndereco,
        estadoEndereco: p.estadoEndereco,
        precision: p.precision,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng, p.lat],
      },
    })),
  );
}

export function isClusterFeature(
  f: GeoJSON.Feature,
): f is GeoJSON.Feature<
  GeoJSON.Point,
  TecnicoPlotClusterProps & {
    cluster: true;
    cluster_id: number;
    point_count: number;
  }
> {
  return (
    f.properties !== null &&
    typeof f.properties === "object" &&
    "cluster" in f.properties &&
    (f.properties as { cluster?: boolean }).cluster === true
  );
}

export function geoPointFeatureToPlot(
  f: GeoJSON.Feature<GeoJSON.Point>,
): TecnicoPlotClusterInput {
  const [lng, lat] = f.geometry.coordinates;
  const p = f.properties as TecnicoPlotClusterProps;
  return {
    id: p.id,
    nome: p.nome,
    cidadeEndereco: p.cidadeEndereco,
    estadoEndereco: p.estadoEndereco,
    lat,
    lng,
    precision: p.precision,
  };
}
