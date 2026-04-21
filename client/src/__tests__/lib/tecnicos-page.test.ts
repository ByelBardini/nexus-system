import { describe, expect, it } from "vitest";
import {
  nextMapState,
  tecnicoPrecoToNum,
  type MapState,
} from "@/lib/tecnicos-page";

describe("nextMapState", () => {
  it("percorre collapsed → expanded → fullscreen → collapsed", () => {
    let s: MapState = "collapsed";
    s = nextMapState(s);
    expect(s).toBe("expanded");
    s = nextMapState(s);
    expect(s).toBe("fullscreen");
    s = nextMapState(s);
    expect(s).toBe("collapsed");
  });
});

describe("tecnicoPrecoToNum", () => {
  it("retorna 0 para undefined", () => {
    expect(tecnicoPrecoToNum(undefined)).toBe(0);
  });

  it("retorna número direto", () => {
    expect(tecnicoPrecoToNum(42)).toBe(42);
  });

  it("parseia string decimal", () => {
    expect(tecnicoPrecoToNum("150.50")).toBe(150.5);
  });

  it("retorna 0 para string não numérica", () => {
    expect(tecnicoPrecoToNum("abc")).toBe(0);
  });

  it("aceita zero em string", () => {
    expect(tecnicoPrecoToNum("0")).toBe(0);
  });
});
