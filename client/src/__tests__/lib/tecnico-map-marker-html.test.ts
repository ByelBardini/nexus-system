import { describe, expect, it } from "vitest";
import {
  escapeHtmlForMarker,
  initialFromNome,
} from "@/lib/tecnico-map-marker-html";

describe("escapeHtmlForMarker", () => {
  it("escapa caracteres especiais", () => {
    expect(escapeHtmlForMarker(`a<b>"c"`)).toBe("a&lt;b&gt;&quot;c&quot;");
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(escapeHtmlForMarker("")).toBe("");
  });

  it("escapa ampersand simples e em sequência", () => {
    expect(escapeHtmlForMarker("&")).toBe("&amp;");
    expect(escapeHtmlForMarker("a&&b")).toBe("a&amp;&amp;b");
  });

  it("não escapa apóstrofo", () => {
    expect(escapeHtmlForMarker("O'Brien")).toBe("O'Brien");
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

  it("preserva letra acentuada inicial", () => {
    expect(initialFromNome("Ícaro")).toBe("Í");
  });

  it("aceita nome de um caractere alfabético", () => {
    expect(initialFromNome("A")).toBe("A");
  });

  it("retorna ? quando primeiro caractere não é letra", () => {
    expect(initialFromNome("🚀foo")).toBe("?");
  });
});
