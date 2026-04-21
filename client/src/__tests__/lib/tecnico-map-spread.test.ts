import { describe, expect, it } from "vitest";
import {
  coordKey,
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
  it("retorna array vazio para lista vazia", () => {
    expect(spreadDuplicateMapCoordinates([])).toEqual([]);
  });

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

  it("dispersa três pontos na mesma coord com distâncias iguais do centro", () => {
    const r = spreadDuplicateMapCoordinates(
      [
        { id: 1, lat: 0, lng: 0, tag: "a" },
        { id: 2, lat: 0, lng: 0, tag: "b" },
        { id: 3, lat: 0, lng: 0, tag: "c" },
      ],
      48,
    );
    expect(r).toHaveLength(3);
    const dists = r.map((p) =>
      Math.hypot(p.displayLat - 0, p.displayLng - 0),
    );
    expect(Math.abs(dists[0] - dists[1])).toBeLessThan(1e-10);
    expect(Math.abs(dists[1] - dists[2])).toBeLessThan(1e-10);
  });

  it("escala deslocamento com radiusMeters maior", () => {
    const base = { id: 1, lat: -10, lng: -20 };
    const [a48] = spreadDuplicateMapCoordinates(
      [base, { ...base, id: 2 }],
      48,
    );
    const [a100] = spreadDuplicateMapCoordinates(
      [base, { ...base, id: 2 }],
      100,
    );
    const d48 = Math.hypot(a48.displayLat - base.lat, a48.displayLng - base.lng);
    const d100 = Math.hypot(
      a100.displayLat - base.lat,
      a100.displayLng - base.lng,
    );
    expect(d100 / d48).toBeGreaterThan(1.9);
    expect(d100 / d48).toBeLessThan(2.2);
  });

  it("próximo ao polo mantém displayLng finito", () => {
    const r = spreadDuplicateMapCoordinates(
      [
        { id: 1, lat: 89, lng: 10 },
        { id: 2, lat: 89, lng: 10 },
      ],
      48,
    );
    expect(Number.isFinite(r[0].displayLng)).toBe(true);
    expect(Number.isFinite(r[1].displayLng)).toBe(true);
  });

  it("preserva lat lng originais e propriedades extras", () => {
    const r = spreadDuplicateMapCoordinates([
      { id: 1, lat: 1, lng: 2, extra: "x" },
    ]);
    expect(r[0].lat).toBe(1);
    expect(r[0].lng).toBe(2);
    expect(r[0].extra).toBe("x");
  });
});

describe("coordKey", () => {
  it("arredonda micrograus de forma estável", () => {
    expect(coordKey(-10.0000004, -20)).toBe(coordKey(-10, -20));
  });
});
