import { describe, expect, it } from "vitest";
import { buildLotePostBody } from "@/pages/aparelhos/cadastro-lote/build-lote-post-body";
import type { LoteFormValues } from "@/pages/aparelhos/cadastro-lote/schema";
import { loteFormDefaultValues } from "@/pages/aparelhos/cadastro-lote/schema";

const marcas = [{ id: 1, nome: "MarcaX", ativo: true }];
const modelos = [
  {
    id: 2,
    nome: "ModY",
    ativo: true,
    marca: { id: 1, nome: "MarcaX" },
  },
] as const;
const operadoras = [{ id: 3, nome: "OpZ", ativo: true }];

const base: LoteFormValues = {
  ...loteFormDefaultValues,
  referencia: "L-1",
  dataChegada: "2026-02-01",
  valorUnitario: 10000,
  quantidade: 0,
  definirIds: true,
  idsTexto: "",
  tipo: "RASTREADOR",
  marca: "1",
  modelo: "2",
  operadora: "",
  abaterDivida: false,
  abaterDebitoId: null,
  abaterQuantidade: null,
  proprietarioTipo: "INFINITY",
  clienteId: null,
};

describe("buildLotePostBody", () => {
  it("monta nomes de marca/modelo no rastreador", () => {
    const body = buildLotePostBody(base, {
      marcasAtivas: marcas,
      modelosDisponiveis: [...modelos],
      operadorasAtivas: operadoras,
      idValidos: ["1".repeat(15)],
      quantidadeFinal: 1,
    });
    expect(body.marca).toBe("MarcaX");
    expect(body.modelo).toBe("ModY");
    expect(body.operadora).toBeNull();
    expect(body.valorUnitario).toBe(100);
  });

  it("zera rastreador no SIM e preenche operadora", () => {
    const body = buildLotePostBody(
      {
        ...base,
        tipo: "SIM",
        operadora: "3",
        marca: "",
        modelo: "",
        marcaSimcard: "5",
        planoSimcard: "",
      },
      {
        marcasAtivas: marcas,
        modelosDisponiveis: [...modelos],
        operadorasAtivas: operadoras,
        idValidos: ["1".repeat(19)],
        quantidadeFinal: 2,
      },
    );
    expect(body.marca).toBeNull();
    expect(body.modelo).toBeNull();
    expect(body.operadora).toBe("OpZ");
    expect(body.marcaSimcardId).toBe(5);
  });

  it("inclui abate apenas quando abaterDivida", () => {
    const b1 = buildLotePostBody(
      { ...base, abaterDivida: true, abaterDebitoId: 9, abaterQuantidade: 2 },
      {
        marcasAtivas: marcas,
        modelosDisponiveis: [...modelos],
        operadorasAtivas: operadoras,
        idValidos: [],
        quantidadeFinal: 3,
      },
    );
    expect(b1.abaterDebitoId).toBe(9);
    expect(b1.abaterQuantidade).toBe(2);
    const b2 = buildLotePostBody(
      { ...base, abaterDivida: false, abaterDebitoId: 9, abaterQuantidade: 2 },
      {
        marcasAtivas: marcas,
        modelosDisponiveis: [...modelos],
        operadorasAtivas: operadoras,
        idValidos: [],
        quantidadeFinal: 1,
      },
    );
    expect(b2.abaterDebitoId).toBeUndefined();
  });

  it("usar idValidos e quantidadeFinal independentes do form no modo lote (payload explícito)", () => {
    const body = buildLotePostBody(
      { ...base, definirIds: true, idsTexto: "x" },
      {
        marcasAtivas: marcas,
        modelosDisponiveis: [...modelos],
        operadorasAtivas: operadoras,
        idValidos: ["A".repeat(15)],
        quantidadeFinal: 99,
      },
    );
    expect(body.quantidade).toBe(99);
    expect(body.identificadores).toEqual(["A".repeat(15)]);
  });
});
