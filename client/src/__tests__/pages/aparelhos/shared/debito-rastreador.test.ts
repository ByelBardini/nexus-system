import { describe, expect, it } from "vitest";
import {
  filterDebitosRastreadores,
  formatDebitoLabel,
} from "@/pages/aparelhos/shared/debito-rastreador";
import type { DebitoRastreadorApi } from "@/pages/aparelhos/shared/debito-rastreador";

function makeDebito(
  overrides: Partial<DebitoRastreadorApi> = {},
): DebitoRastreadorApi {
  return {
    id: 1,
    devedorTipo: "INFINITY",
    devedorClienteId: null,
    devedorCliente: null,
    credorTipo: "INFINITY",
    credorClienteId: null,
    credorCliente: null,
    marcaId: 10,
    marca: { id: 10, nome: "Marca" },
    modeloId: 20,
    modelo: { id: 20, nome: "Modelo" },
    quantidade: 2,
    ...overrides,
  };
}

describe("formatDebitoLabel", () => {
  it("formata devedor e credor Infinity quando clientes faltam", () => {
    const d = makeDebito();
    expect(formatDebitoLabel(d)).toBe(
      "Infinity deve 2x Marca Modelo → Infinity",
    );
  });

  it("inclui nomes de clientes devedor e credor", () => {
    const d = makeDebito({
      devedorTipo: "CLIENTE",
      devedorClienteId: 1,
      devedorCliente: { id: 1, nome: "A" },
      credorCliente: { id: 2, nome: "B" },
    });
    expect(formatDebitoLabel(d)).toBe("A deve 2x Marca Modelo → B");
  });
});

describe("filterDebitosRastreadores", () => {
  const lista: DebitoRastreadorApi[] = [
    makeDebito({ id: 1, devedorTipo: "INFINITY" }),
    makeDebito({
      id: 2,
      devedorTipo: "CLIENTE",
      devedorClienteId: 5,
      devedorCliente: { id: 5, nome: "C" },
      marcaId: 1,
      modeloId: 1,
    }),
    makeDebito({
      id: 3,
      devedorTipo: "CLIENTE",
      devedorClienteId: 5,
      devedorCliente: { id: 5, nome: "C" },
      marcaId: 10,
      modeloId: 20,
    }),
  ];

  it("retorna vazio com lista vazia", () => {
    expect(
      filterDebitosRastreadores([], {
        proprietario: "INFINITY",
        clienteId: null,
        marcaModelo: null,
      }),
    ).toEqual([]);
  });

  it("filtra devedor Infinity", () => {
    const r = filterDebitosRastreadores(lista, {
      proprietario: "INFINITY",
      clienteId: null,
      marcaModelo: null,
    });
    expect(r.map((d) => d.id)).toEqual([1]);
  });

  it("filtra devedor cliente com clienteId", () => {
    const r = filterDebitosRastreadores(lista, {
      proprietario: "CLIENTE",
      clienteId: 5,
      marcaModelo: null,
    });
    expect(r.map((d) => d.id)).toEqual([2, 3]);
  });

  it("exclui cliente se clienteId inexistente com proprietario CLIENTE", () => {
    const r = filterDebitosRastreadores(lista, {
      proprietario: "CLIENTE",
      clienteId: null,
      marcaModelo: null,
    });
    expect(r).toEqual([]);
  });

  it("refina por marca e modelo", () => {
    const r = filterDebitosRastreadores(lista, {
      proprietario: "CLIENTE",
      clienteId: 5,
      marcaModelo: { marcaId: 10, modeloId: 20 },
    });
    expect(r.map((d) => d.id)).toEqual([3]);
  });

  it("marcaModelo null não aplica corte de marca (mantém devedor)", () => {
    const r = filterDebitosRastreadores(lista, {
      proprietario: "INFINITY",
      clienteId: null,
      marcaModelo: null,
    });
    expect(r).toHaveLength(1);
  });
});
