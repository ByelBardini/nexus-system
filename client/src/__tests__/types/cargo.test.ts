import { describe, expect, it } from "vitest";
import {
  CATEGORIA_CONFIG,
  categoriaCargoOuOperacional,
  categoriaCargoParaBadge,
  type CategoriaCargo,
} from "@/types/cargo";

describe("CATEGORIA_CONFIG", () => {
  it("define as três categorias conhecidas", () => {
    const keys = Object.keys(CATEGORIA_CONFIG) as CategoriaCargo[];
    expect(keys.sort()).toEqual(
      ["ADMINISTRATIVO", "GESTAO", "OPERACIONAL"].sort(),
    );
  });

  it("cada entrada tem label, className e dotColor não vazios", () => {
    for (const k of Object.keys(CATEGORIA_CONFIG) as CategoriaCargo[]) {
      const c = CATEGORIA_CONFIG[k];
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.className).toMatch(/\S/);
      expect(c.dotColor).toMatch(/\S/);
    }
  });
});

describe("categoriaCargoParaBadge", () => {
  it("retorna config oficial para categorias válidas", () => {
    expect(categoriaCargoParaBadge("GESTAO")).toEqual(CATEGORIA_CONFIG.GESTAO);
  });

  it("para categoria desconhecida usa rótulo cru e estilo neutro", () => {
    const b = categoriaCargoParaBadge("LEGADO_X");
    expect(b.label).toBe("LEGADO_X");
    expect(b.className).toContain("slate");
    expect(b.dotColor).toBeDefined();
  });

  it("string vazia cai no ramo desconhecido", () => {
    const b = categoriaCargoParaBadge("");
    expect(b.label).toBe("");
  });
});

describe("categoriaCargoOuOperacional", () => {
  it("retorna Operacional para valor inválido", () => {
    expect(categoriaCargoOuOperacional("")).toEqual(
      CATEGORIA_CONFIG.OPERACIONAL,
    );
    expect(categoriaCargoOuOperacional("INVALID")).toEqual(
      CATEGORIA_CONFIG.OPERACIONAL,
    );
  });

  it("retorna config correta para ADMINISTRATIVO", () => {
    expect(categoriaCargoOuOperacional("ADMINISTRATIVO")).toEqual(
      CATEGORIA_CONFIG.ADMINISTRATIVO,
    );
  });
});
