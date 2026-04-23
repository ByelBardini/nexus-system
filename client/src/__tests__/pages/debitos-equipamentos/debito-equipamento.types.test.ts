import { describe, expect, it } from "vitest";
import type { DebitoRastreadorListaApi } from "@/pages/debitos-equipamentos/domain/types";
import { buildDebitoRastreadorListaApi } from "./debitos-equipamentos.fixtures";

describe("debitos-equipamentos types (fixtures)", () => {
  it("fixture satisfaz DebitoRastreadorListaApi com campos base de cadastro", () => {
    const d: DebitoRastreadorListaApi = buildDebitoRastreadorListaApi();
    expect(d.devedorClienteId).toBe(10);
    expect(d.marcaId).toBe(1);
    expect(d.modeloId).toBe(2);
    expect(d.atualizadoEm).toBeTruthy();
  });

  it("permite historicos opcionais e quantidade zero (quitado na view)", () => {
    const d = buildDebitoRastreadorListaApi({
      quantidade: 0,
      historicos: undefined,
    });
    expect(d.quantidade).toBe(0);
    expect(d.historicos).toBeUndefined();
  });
});
