import { describe, expect, it } from "vitest";
import { buildTecnicoSupercluster } from "@/lib/tecnico-map-cluster";

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
});
