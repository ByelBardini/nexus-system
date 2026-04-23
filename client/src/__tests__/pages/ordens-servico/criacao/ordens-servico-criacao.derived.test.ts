import { describe, it, expect } from "vitest";
import {
  mapCriacaoOsWatchFields,
  computeCriacaoOsDerivedFlags,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.derived";

const fullAddress = {
  subclienteTelefone: "11999999999",
  subclienteNome: "A",
  subclienteCep: "1",
  subclienteLogradouro: "L",
  subclienteNumero: "1",
  subclienteBairro: "B",
  subclienteEstado: "SP",
  subclienteCidade: "S",
  ordemInstalacao: "INFINITY" as const,
  clienteOrdemId: undefined,
  tecnicoId: 1,
  veiculoPlaca: "X",
  veiculoMarca: "m",
  veiculoModelo: "o",
  tipo: "REVISAO",
};

describe("mapCriacaoOsWatchFields", () => {
  it("mapeia tupla na ordem correta (15 campos)", () => {
    const arr: (string | number | boolean | undefined)[] = new Array(15);
    arr[8] = "INFINITY";
    arr[10] = 2;
    arr[11] = "P";
    arr[12] = "M";
    arr[13] = "O";
    arr[14] = "RETIRADA";
    const w = mapCriacaoOsWatchFields(arr);
    expect(w.ordemInstalacao).toBe("INFINITY");
    expect(w.tecnicoId).toBe(2);
    expect(w.veiculoPlaca).toBe("P");
    expect(w.tipo).toBe("RETIRADA");
  });
});

describe("computeCriacaoOsDerivedFlags", () => {
  it("isFormValid exige tipo e dados completos de cliente (Infinity + id)", () => {
    const w = { ...fullAddress };
    const f = computeCriacaoOsDerivedFlags(w, 100);
    expect(f.temCliente).toBe(true);
    expect(f.temTipo).toBe(true);
    expect(f.isFormValid).toBe(true);
  });

  it("falta infinity id: isFormValid false", () => {
    const f = computeCriacaoOsDerivedFlags(
      { ...fullAddress, ordemInstalacao: "INFINITY" },
      null,
    );
    expect(f.temCliente).toBe(false);
    expect(f.isFormValid).toBe(false);
  });

  it("modo CLIENTE exige clienteOrdemId", () => {
    const f = computeCriacaoOsDerivedFlags(
      {
        ...fullAddress,
        ordemInstalacao: "CLIENTE",
        clienteOrdemId: 5,
      },
      null,
    );
    expect(f.temCliente).toBe(true);
  });

  it("modo CLIENTE sem cliente: temCliente false", () => {
    const f = computeCriacaoOsDerivedFlags(
      {
        ...fullAddress,
        ordemInstalacao: "CLIENTE",
        clienteOrdemId: undefined,
      },
      null,
    );
    expect(f.temCliente).toBe(false);
  });

  it("técnico: flags separadas de isFormValid", () => {
    const f = computeCriacaoOsDerivedFlags(
      { ...fullAddress, tecnicoId: 0, tipo: "REVISAO" },
      1,
    );
    expect(f.temTecnico).toBe(false);
    expect(f.isFormValid).toBe(true);
  });
});
