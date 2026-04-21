import { describe, expect, it } from "vitest";
import {
  groupPlotsByCoordinate,
  spreadDuplicateMapCoordinates,
} from "@/lib/tecnico-map-spread";

describe("groupPlotsByCoordinate", () => {
  it("agrupa itens com mesma coordenada arredondada em micrograus", () => {
    const m = groupPlotsByCoordinate([
      { id: 2, lat: -10, lng: -20, nome: "b" },
      { id: 1, lat: -10, lng: -20, nome: "a" },
    ]);
    expect(m.size).toBe(1);
    const [only] = m.values();
    expect(only?.map((x) => x.id)).toEqual([1, 2]);
  });
});

describe("spreadDuplicateMapCoordinates", () => {
  it("não altera posição quando há um único ponto", () => {
    const [one] = spreadDuplicateMapCoordinates([
      { id: 1, lat: -10, lng: -20, nome: "A" },
    ]);
    expect(one.displayLat).toBe(-10);
    expect(one.displayLng).toBe(-20);
  });

  it("dispersa dois pontos com mesmas coordenadas em lados opostos do círculo", () => {
    const r = spreadDuplicateMapCoordinates(
      [
        { id: 1, lat: -27.5, lng: -48.5, nome: "A" },
        { id: 2, lat: -27.5, lng: -48.5, nome: "B" },
      ],
      48,
    );
    expect(r).toHaveLength(2);
    const d0 = Math.hypot(r[0].displayLat - -27.5, r[0].displayLng - -48.5);
    const d1 = Math.hypot(r[1].displayLat - -27.5, r[1].displayLng - -48.5);
    expect(d0).toBeGreaterThan(0.00001);
    expect(d1).toBeGreaterThan(0.00001);
    expect(Math.abs(d0 - d1)).toBeLessThan(1e-8);
  });

  it("ordena por id estável quando há empate de coordenadas", () => {
    const r = spreadDuplicateMapCoordinates([
      { id: 10, lat: 1, lng: 2 },
      { id: 5, lat: 1, lng: 2 },
      { id: 7, lat: 1, lng: 2 },
    ]);
    expect(r.map((x) => x.id)).toEqual([5, 7, 10]);
  });

  it("não agrupa pontos cujo arredondamento em micrograus difere", () => {
    const r = spreadDuplicateMapCoordinates([
      { id: 1, lat: -27.5, lng: -48.5 },
      { id: 2, lat: -27.500002, lng: -48.5 },
    ]);
    expect(r[0].displayLat).toBe(r[0].lat);
    expect(r[1].displayLat).toBe(r[1].lat);
  });
});
