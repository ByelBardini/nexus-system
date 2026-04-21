import { describe, expect, it } from "vitest";
import {
  buildTecnicoSupercluster,
  geoPointFeatureToPlot,
  isClusterFeature,
} from "@/lib/tecnico-map-cluster";

const bboxWorld: [number, number, number, number] = [-180, -85, 180, 85];

describe("buildTecnicoSupercluster", () => {
  it("com zoom alto, pontos distantes permanecem separados (sem cluster)", () => {
    const index = buildTecnicoSupercluster([
      {
        id: 1,
        nome: "A",
        cidadeEndereco: null,
        estadoEndereco: null,
        lat: -23.5,
        lng: -46.6,
        precision: "EXATO",
      },
      {
        id: 2,
        nome: "B",
        cidadeEndereco: null,
        estadoEndereco: null,
        lat: -8.0,
        lng: -35.0,
        precision: "EXATO",
      },
    ]);
    const r = index.getClusters(bboxWorld, 17);
    expect(r).toHaveLength(2);
    expect((r[0].properties as { cluster?: boolean }).cluster).toBeFalsy();
    expect((r[1].properties as { cluster?: boolean }).cluster).toBeFalsy();
  });

  it("com zoom baixo, duas posições iguais viram um cluster", () => {
    const index = buildTecnicoSupercluster([
      {
        id: 1,
        nome: "A",
        cidadeEndereco: null,
        estadoEndereco: null,
        lat: -23.5,
        lng: -46.6,
        precision: "EXATO",
      },
      {
        id: 2,
        nome: "B",
        cidadeEndereco: null,
        estadoEndereco: null,
        lat: -23.5,
        lng: -46.6,
        precision: "EXATO",
      },
    ]);
    const r = index.getClusters(bboxWorld, 4);
    expect(r).toHaveLength(1);
    expect((r[0].properties as { cluster?: boolean }).cluster).toBe(true);
  });

  it("lista vazia produz índice sem clusters", () => {
    const index = buildTecnicoSupercluster([]);
    const r = index.getClusters(bboxWorld, 4);
    expect(r).toHaveLength(0);
  });

  it("getLeaves preserva id nome e precision", () => {
    const index = buildTecnicoSupercluster([
      {
        id: 7,
        nome: "Sete",
        cidadeEndereco: "X",
        estadoEndereco: "Y",
        lat: -23.5,
        lng: -46.6,
        precision: "CIDADE",
      },
      {
        id: 8,
        nome: "Oito",
        cidadeEndereco: null,
        estadoEndereco: null,
        lat: -23.5,
        lng: -46.6,
        precision: "EXATO",
      },
    ]);
    const clusters = index.getClusters(bboxWorld, 4);
    expect(clusters).toHaveLength(1);
    const c = clusters[0];
    expect(isClusterFeature(c)).toBe(true);
    const clusterId = (c.properties as { cluster_id: number }).cluster_id;
    const leaves = index.getLeaves(clusterId, Infinity, 0);
    expect(leaves.length).toBe(2);
    const props = leaves.map(
      (leaf) =>
        leaf.properties as { id: number; nome: string; precision: string },
    );
    expect(props.map((p) => p.id).sort()).toEqual([7, 8]);
    expect(props.some((p) => p.precision === "CIDADE")).toBe(true);
  });
});

describe("isClusterFeature", () => {
  it("identifica feature de cluster", () => {
    const f = {
      type: "Feature" as const,
      properties: { cluster: true, cluster_id: 1, point_count: 2 },
      geometry: { type: "Point" as const, coordinates: [0, 0] },
    };
    expect(isClusterFeature(f)).toBe(true);
  });

  it("rejeita ponto simples", () => {
    const f = {
      type: "Feature" as const,
      properties: { id: 1, nome: "A", precision: "EXATO" },
      geometry: { type: "Point" as const, coordinates: [-46, -23] },
    };
    expect(isClusterFeature(f)).toBe(false);
  });
});

describe("geoPointFeatureToPlot", () => {
  it("inverte coordinates para lng lat e copia props", () => {
    const f = {
      type: "Feature" as const,
      properties: {
        id: 3,
        nome: "Tres",
        cidadeEndereco: "C",
        estadoEndereco: "D",
        precision: "EXATO" as const,
      },
      geometry: { type: "Point" as const, coordinates: [-50.5, -20.25] },
    };
    const p = geoPointFeatureToPlot(f);
    expect(p).toEqual({
      id: 3,
      nome: "Tres",
      cidadeEndereco: "C",
      estadoEndereco: "D",
      lat: -20.25,
      lng: -50.5,
      precision: "EXATO",
    });
  });
});
