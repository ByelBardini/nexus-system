import { describe, expect, it } from "vitest";
import {
  filterMarcasSimcardPorNomeOperadora,
  filterModelosPorNomeMarca,
} from "@/pages/equipamentos/pareamento/domain/catalog-helpers";

describe("catalog-helpers", () => {
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

  describe("filterModelosPorNomeMarca", () => {
    it("retorna modelos da marca quando o nome existe", () => {
      expect(
        filterModelosPorNomeMarca("Suntech", marcasAtivas, modelos),
      ).toEqual([modelos[0]]);
    });

    it("edge: nomeMarca vazio → []", () => {
      expect(filterModelosPorNomeMarca("", marcasAtivas, modelos)).toEqual([]);
    });

    it("edge: marca inexistente nas ativas → []", () => {
      expect(
        filterModelosPorNomeMarca("NaoExiste", marcasAtivas, modelos),
      ).toEqual([]);
    });

    it("edge: lista de modelos vazia → []", () => {
      expect(
        filterModelosPorNomeMarca("Suntech", marcasAtivas, []),
      ).toEqual([]);
    });

    it("edge: marcas ativas vazias → []", () => {
      expect(filterModelosPorNomeMarca("Suntech", [], modelos)).toEqual([]);
    });
  });

  describe("filterMarcasSimcardPorNomeOperadora", () => {
    it("retorna marcas filtradas pela operadora ativa", () => {
      expect(
        filterMarcasSimcardPorNomeOperadora(
          "Claro",
          operadorasAtivas,
          marcasSimcard,
        ),
      ).toEqual([marcasSimcard[0]]);
    });

    it("edge: nome operadora vazio → []", () => {
      expect(
        filterMarcasSimcardPorNomeOperadora("", operadorasAtivas, marcasSimcard),
      ).toEqual([]);
    });

    it("edge: operadora inexistente nas ativas → []", () => {
      expect(
        filterMarcasSimcardPorNomeOperadora(
          "Oi",
          operadorasAtivas,
          marcasSimcard,
        ),
      ).toEqual([]);
    });

    it("edge: operadora ativa mas sem marcas com operadoraId → []", () => {
      expect(
        filterMarcasSimcardPorNomeOperadora("Claro", operadorasAtivas, []),
      ).toEqual([]);
    });
  });
});
