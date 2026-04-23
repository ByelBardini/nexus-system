import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getInitials,
  getSetorLabel,
  getAccessLevel,
  formatLastLogin,
  computeAccessScore,
} from "@/pages/usuarios/lib/usuarios-format";
import type { CargoWithPermissions, UsuarioListItem } from "@/types/usuarios";

describe("getInitials", () => {
  it("duas partes: primeira e última letra", () => {
    expect(getInitials("João Silva")).toBe("JS");
  });

  it("uma palavra: duas primeiras letras", () => {
    expect(getInitials("Maria")).toBe("MA");
  });

  it("três partes: usa primeira e última", () => {
    expect(getInitials("Ana Clara Costa")).toBe("AC");
  });
});

describe("getSetorLabel", () => {
  it("mapeia setor e retorna vazio sem setor", () => {
    expect(getSetorLabel("AGENDAMENTO")).toBe("Agendamento");
    expect(getSetorLabel(null)).toBe("");
  });
});

describe("getAccessLevel", () => {
  const u = (partial: Partial<UsuarioListItem>): UsuarioListItem => ({
    id: 1,
    nome: "A",
    email: "a@a.com",
    ativo: true,
    createdAt: new Date().toISOString(),
    ...partial,
  });

  it("Nenhum sem cargos ou total 0", () => {
    expect(getAccessLevel(u({}), 10).label).toBe("Nenhum");
    expect(
      getAccessLevel(
        u({ usuarioCargos: [] }),
        10,
      ).label,
    ).toBe("Nenhum");
  });

  it("escala de faixas por percentual", () => {
    const user25 = u({
      usuarioCargos: [
        {
          cargo: {
            id: 1,
            nome: "C",
            categoria: "O",
            cargoPermissoes: [{ permissaoId: 1 }, { permissaoId: 2 }],
          },
        },
      ],
    });
    expect(getAccessLevel(user25, 8).label).toBe("Baixo");

    const user50 = u({
      usuarioCargos: [
        {
          cargo: {
            id: 1,
            nome: "C",
            categoria: "O",
            cargoPermissoes: Array.from({ length: 3 }, (_, i) => ({
              permissaoId: i + 1,
            })),
          },
        },
      ],
    });
    expect(getAccessLevel(user50, 6).label).toBe("Médio");
  });
});

describe("formatLastLogin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Nunca acessou", () => {
    expect(formatLastLogin(null)).toBe("Nunca acessou");
    expect(formatLastLogin(undefined)).toBe("Nunca acessou");
  });

  it("Hoje: mesmo dia (UTC comparado a now fixo)", () => {
    const sameDay = "2026-04-22T10:00:00.000Z";
    const out = formatLastLogin(sameDay);
    expect(out).toMatch(/^Hoje,/);
  });

  it("Ontem", () => {
    const out = formatLastLogin("2026-04-21T10:00:00.000Z");
    expect(out).toMatch(/^Ontem,/);
  });

  it("2–6 dias: texto relativo", () => {
    expect(formatLastLogin("2026-04-20T10:00:00.000Z")).toMatch(/2 dias atrás/);
  });

  it("≥7 dias: data formatada", () => {
    const out = formatLastLogin("2026-04-10T10:00:00.000Z");
    expect(out).toMatch(/de\s*abr\.\s*de\s*2026|abr/i);
  });
});

describe("computeAccessScore", () => {
  const cargo = (id: number, permIds: number[]): CargoWithPermissions => ({
    id,
    code: "c",
    nome: "n",
    categoria: "O",
    setor: { id: 1, code: "s", nome: "S" },
    cargoPermissoes: permIds.map((pid) => ({
      permissao: { id: pid, code: "A.B.C" },
    })),
  });

  it("0 sem permissões totais, sem seleção, ou vazio", () => {
    expect(computeAccessScore([1], [cargo(1, [1, 2])], 0)).toBe(0);
    expect(computeAccessScore([], [cargo(1, [1])], 4)).toBe(0);
  });

  it("conta ids únicos de permissão", () => {
    const c = cargo(1, [1, 1, 2]);
    expect(computeAccessScore([1], [c], 4)).toBe(50);
  });
});
