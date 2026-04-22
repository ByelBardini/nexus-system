import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePareamentoCatalogDerivados } from "@/pages/equipamentos/pareamento/hooks/usePareamentoCatalogDerivados";

const marcasAtivas = [
  { id: 1, nome: "Suntech", ativo: true },
  { id: 2, nome: "Outra", ativo: true },
];
const modelos = [
  { id: 10, nome: "ST-901", marca: { id: 1 } },
  { id: 11, nome: "X", marca: { id: 2 } },
];
const operadorasAtivas = [
  { id: 100, nome: "Claro", ativo: true },
  { id: 101, nome: "Vivo", ativo: true },
];
const marcasSimcard = [
  {
    id: 200,
    nome: "Marca A",
    operadoraId: 100,
    temPlanos: true,
    operadora: { id: 100, nome: "Claro" },
  },
  {
    id: 201,
    nome: "Marca B",
    operadoraId: 101,
    temPlanos: true,
    operadora: { id: 101, nome: "Vivo" },
  },
];

const baseInput = {
  marcaRastreador: "",
  marcaRastreadorMassa: "",
  operadoraSim: "",
  operadoraSimMassa: "",
  marcasAtivas,
  modelos,
  operadorasAtivas,
  marcasSimcard,
};

describe("usePareamentoCatalogDerivados", () => {
  it("individual e massa independentes: marcas/modelos distintos", () => {
    const { result } = renderHook(() =>
      usePareamentoCatalogDerivados({
        ...baseInput,
        marcaRastreador: "Suntech",
        marcaRastreadorMassa: "Outra",
        operadoraSim: "Claro",
        operadoraSimMassa: "Vivo",
      }),
    );
    expect(result.current.modelosPorMarca).toEqual([modelos[0]]);
    expect(result.current.modelosPorMarcaMassa).toEqual([modelos[1]]);
    expect(result.current.marcasSimcardPorOperadora).toEqual([
      marcasSimcard[0],
    ]);
    expect(result.current.marcasSimcardPorOperadoraMassa).toEqual([
      marcasSimcard[1],
    ]);
  });

  it("edge: tudo vazio → quatro listas vazias", () => {
    const { result } = renderHook(() =>
      usePareamentoCatalogDerivados(baseInput),
    );
    expect(result.current.modelosPorMarca).toEqual([]);
    expect(result.current.modelosPorMarcaMassa).toEqual([]);
    expect(result.current.marcasSimcardPorOperadora).toEqual([]);
    expect(result.current.marcasSimcardPorOperadoraMassa).toEqual([]);
  });
});
