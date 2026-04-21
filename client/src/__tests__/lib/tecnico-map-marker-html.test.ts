import { describe, expect, it } from "vitest";
import {
  escapeHtmlForMarker,
  initialFromNome,
} from "@/lib/tecnico-map-marker-html";

describe("escapeHtmlForMarker", () => {
  it("escapa caracteres especiais", () => {
    expect(escapeHtmlForMarker(`a<b>"c"`)).toBe("a&lt;b&gt;&quot;c&quot;");
  });
});

describe("initialFromNome", () => {
  it("retorna primeira letra em maiúscula", () => {
    expect(initialFromNome("Jones")).toBe("J");
  });

  it("ignora espaços à esquerda", () => {
    expect(initialFromNome("  Maria")).toBe("M");
  });

  it("retorna ? quando vazio ou sem letra", () => {
    expect(initialFromNome("")).toBe("?");
    expect(initialFromNome("   ")).toBe("?");
    expect(initialFromNome("123")).toBe("?");
  });
});
