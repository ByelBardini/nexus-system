import { describe, expect, it } from "vitest";
import {
  CSV_HEADER,
  computeMassaLists,
  filtrarLotesRastreadores,
  filtrarLotesSims,
  gerarTemplateCsv,
  normalizarCabecalho,
  parseIds,
  processCsvRowsFromPapa,
} from "@/pages/equipamentos/pareamento/domain/parsing";

describe("pareamento.domain — normalizarCabecalho", () => {
  it("remove espaços, aspas e lowercases", () => {
    expect(normalizarCabecalho("  IMEI  ")).toBe("imei");
    expect(normalizarCabecalho(`"Marca_Rastreador"`)).toBe("marca_rastreador");
    expect(normalizarCabecalho("Marca (Rastreador)")).toBe("marca(rastreador)");
  });
});

describe("pareamento.domain — parseIds", () => {
  it("retorna vazio para string vazia ou só espaços", () => {
    expect(parseIds("")).toEqual([]);
    expect(parseIds("   ")).toEqual([]);
  });

  it("split por vírgula, ponto-e-vírgula e quebras de linha", () => {
    expect(parseIds("a,b;c\nd")).toEqual(["a", "b", "c", "d"]);
  });

  it("remove zero-width e BOM entre tokens", () => {
    expect(parseIds(`3589\u200B24109982341`)).toEqual(["358924109982341"]);
  });

  it("filtra tokens vazios após trim", () => {
    expect(parseIds("x,,;\ny")).toEqual(["x", "y"]);
  });
});

describe("pareamento.domain — computeMassaLists", () => {
  it("quantidadeBate false quando contagens diferem", () => {
    const r = computeMassaLists("1\n2", "1");
    expect(r.quantidadeBate).toBe(false);
    expect(r.paresMassa).toEqual([]);
  });

  it("paresMassa vazio quando listas vazias", () => {
    const r = computeMassaLists("", "");
    expect(r.quantidadeBate).toBe(true);
    expect(r.paresMassa).toEqual([]);
  });

  it("emparelha na ordem quando contagens batem", () => {
    const r = computeMassaLists("111;222", "333\n444");
    expect(r.quantidadeBate).toBe(true);
    expect(r.paresMassa).toEqual([
      { imei: "111", iccid: "333" },
      { imei: "222", iccid: "444" },
    ]);
  });
});

describe("pareamento.domain — processCsvRowsFromPapa", () => {
  it("retorna erro quando há erros de parse", () => {
    const r = processCsvRowsFromPapa([], [{ message: "fail" }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("fail");
  });

  it("mapeia aliases e ignora linhas sem imei/iccid", () => {
    const r = processCsvRowsFromPapa(
      [
        {
          IMEI: "358942109982341",
          iccid: "8955101234567890123",
          foo: "bar",
        },
        { col: "only" },
      ],
      [],
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.linhas).toHaveLength(1);
  });

  it("erro quando nenhuma linha válida", () => {
    const r = processCsvRowsFromPapa([{ x: "1" }], []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/nenhuma linha válida/i);
  });
});

describe("pareamento.domain — filtrarLotesRastreadores", () => {
  const lotes = [
    {
      id: 1,
      referencia: "L-A",
      quantidadeDisponivelSemId: 1,
      modelo: "M1",
      marca: "Br",
      operadora: null,
      marcaSimcardId: null,
    },
  ];

  it("retorna todos quando busca vazia", () => {
    expect(filtrarLotesRastreadores(lotes, "")).toEqual(lotes);
  });

  it("filtra por referência ou marca/modelo", () => {
    expect(filtrarLotesRastreadores(lotes, "l-a")).toEqual(lotes);
    expect(filtrarLotesRastreadores(lotes, "br")).toEqual(lotes);
    expect(filtrarLotesRastreadores(lotes, "zzz")).toEqual([]);
  });
});

describe("pareamento.domain — filtrarLotesSims", () => {
  const lotes = [
    {
      id: 1,
      referencia: "S-1",
      quantidadeDisponivelSemId: 1,
      modelo: null,
      marca: null,
      operadora: "Claro",
      marcaSimcardId: 10,
    },
  ];
  const marcas = [
    {
      id: 10,
      nome: "XSim",
      operadoraId: 1,
      temPlanos: false,
      operadora: { id: 1, nome: "Claro" },
    },
  ];

  it("inclui nome da marca simcard no texto de busca", () => {
    expect(filtrarLotesSims(lotes, "xsim", marcas)).toEqual(lotes);
    expect(filtrarLotesSims(lotes, "nada", marcas)).toEqual([]);
  });
});

describe("pareamento.domain — gerarTemplateCsv", () => {
  it("primeira linha contém todas as colunas na ordem do CSV_HEADER", () => {
    const texto = gerarTemplateCsv();
    const primeira = texto.split("\n")[0];
    expect(primeira).toBe(CSV_HEADER.join(";"));
  });
});
