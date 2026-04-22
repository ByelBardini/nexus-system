import { describe, expect, it } from "vitest";
import {
  computeMarcasDisponiveis,
  computeStatusCounts,
  filterAparelhos,
  getClienteOuInfinityColunaTabela,
  getIdentificadorVinculado,
  getNomeDestaqueVinculosTecnico,
  getRastreadorVinculadoAoSim,
  getTecnicoNomeColunaTabela,
  kitMapFromList,
  resolveKitNome,
  slicePagina,
  totalPaginas,
} from "@/pages/aparelhos/lista/aparelhos-list.helpers";
import { PAGE_SIZE } from "@/pages/aparelhos/lista/aparelhos-page.shared";
import { aparelhoFixture } from "./fixtures";

describe("aparelhos-list.helpers", () => {
  describe("getRastreadorVinculadoAoSim / getIdentificadorVinculado", () => {
    it("retorna primeiro rastreador vinculado quando tipo é SIM", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "SIM",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
        aparelhosVinculados: [
          {
            id: 9,
            identificador: "IMEI-9",
            kitId: 1,
            tecnico: { id: 1, nome: "Tec A" },
          },
        ],
      });
      expect(getRastreadorVinculadoAoSim(ap)?.identificador).toBe("IMEI-9");
      expect(getIdentificadorVinculado(ap)).toBe("IMEI-9");
    });

    it("para RASTREADOR usa simVinculado e ignora aparelhosVinculados", () => {
      const ap = aparelhoFixture({
        id: 2,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        proprietario: "CLIENTE",
        simVinculado: { id: 3, identificador: "ICCID-X" },
        aparelhosVinculados: [{ id: 99, identificador: "ignored" }],
      });
      expect(getIdentificadorVinculado(ap)).toBe("ICCID-X");
    });

    it("edge: SIM sem vinculados retorna undefined", () => {
      const ap = aparelhoFixture({
        id: 3,
        tipo: "SIM",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
        aparelhosVinculados: [],
      });
      expect(getIdentificadorVinculado(ap)).toBeUndefined();
    });
  });

  describe("resolveKitNome", () => {
    const map = new Map<number, string>([[10, "Kit Mapa"]]);

    it("prioriza kit do próprio aparelho", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "RASTREADOR",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
        kit: { id: 1, nome: "Kit Direto" },
        kitId: 10,
      });
      expect(resolveKitNome(ap, map)).toBe("Kit Direto");
    });

    it("usa kitsPorId quando kit aninhado ausente", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "RASTREADOR",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
        kitId: 10,
        kit: null,
      });
      expect(resolveKitNome(ap, map)).toBe("Kit Mapa");
    });

    it("para SIM usa kit do rastreador vinculado", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "SIM",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
        aparelhosVinculados: [
          { id: 5, identificador: "R1", kit: { id: 2, nome: "Kit R" } },
        ],
      });
      expect(resolveKitNome(ap, map)).toBe("Kit R");
    });

    it("edge: sem kit retorna null", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "SIM",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
      });
      expect(resolveKitNome(ap, map)).toBeNull();
    });
  });

  describe("getTecnicoNomeColunaTabela vs getNomeDestaqueVinculosTecnico", () => {
    it("coluna tabela não usa cliente do aparelho como técnico", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "RASTREADOR",
        status: "COM_TECNICO",
        proprietario: "CLIENTE",
        cliente: { id: 1, nome: "Cliente SA" },
        tecnico: null,
      });
      expect(getTecnicoNomeColunaTabela(ap)).toBeNull();
      expect(getNomeDestaqueVinculosTecnico(ap)).toBe("Cliente SA");
    });

    it("SIM herda técnico do rastreador vinculado na coluna", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "SIM",
        status: "DESPACHADO",
        proprietario: "INFINITY",
        aparelhosVinculados: [
          { id: 2, identificador: "X", tecnico: { id: 1, nome: "João" } },
        ],
      });
      expect(getTecnicoNomeColunaTabela(ap)).toBe("João");
    });
  });

  describe("getClienteOuInfinityColunaTabela", () => {
    it("Infinity sem cliente exibe Infinity", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "RASTREADOR",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
      });
      expect(getClienteOuInfinityColunaTabela(ap)).toBe("Infinity");
    });

    it("CLIENTE com nome no rastreador vinculado ao SIM", () => {
      const ap = aparelhoFixture({
        id: 1,
        tipo: "SIM",
        status: "INSTALADO",
        proprietario: "CLIENTE",
        cliente: null,
        aparelhosVinculados: [
          {
            id: 2,
            identificador: "Z",
            cliente: { id: 3, nome: "Sub Cliente" },
            proprietario: "CLIENTE",
          },
        ],
      });
      expect(getClienteOuInfinityColunaTabela(ap)).toBe("Sub Cliente");
    });
  });

  describe("computeMarcasDisponiveis", () => {
    it("agrega marcas de rastreador e operadoras de SIM, ordenado", () => {
      const list = [
        aparelhoFixture({
          id: 1,
          tipo: "RASTREADOR",
          status: "EM_ESTOQUE",
          proprietario: "INFINITY",
          marca: "B",
        }),
        aparelhoFixture({
          id: 2,
          tipo: "SIM",
          status: "EM_ESTOQUE",
          proprietario: "INFINITY",
          operadora: "A",
        }),
      ];
      expect(computeMarcasDisponiveis(list)).toEqual(["A", "B"]);
    });
  });

  describe("filterAparelhos", () => {
    const base = [
      aparelhoFixture({
        id: 1,
        tipo: "RASTREADOR",
        status: "EM_ESTOQUE",
        proprietario: "INFINITY",
        identificador: "IMEI-1",
        marca: "Teltonika",
      }),
      aparelhoFixture({
        id: 2,
        tipo: "SIM",
        status: "CONFIGURADO",
        proprietario: "CLIENTE",
        cliente: { id: 1, nome: "Acme" },
        operadora: "Vivo",
        identificador: "89",
      }),
    ];

    it("busca vazia não remove itens", () => {
      expect(
        filterAparelhos(base, {
          busca: "   ",
          statusFilter: "TODOS",
          tipoFilter: "TODOS",
          proprietarioFilter: "TODOS",
          marcaFilter: "TODOS",
        }).length,
      ).toBe(2);
    });

    it("busca case-insensitive por identificador", () => {
      const r = filterAparelhos(base, {
        busca: "imei-1",
        statusFilter: "TODOS",
        tipoFilter: "TODOS",
        proprietarioFilter: "TODOS",
        marcaFilter: "TODOS",
      });
      expect(r.map((x) => x.id)).toEqual([1]);
    });

    it("edge: nenhum match retorna lista vazia", () => {
      expect(
        filterAparelhos(base, {
          busca: "zzz",
          statusFilter: "TODOS",
          tipoFilter: "TODOS",
          proprietarioFilter: "TODOS",
          marcaFilter: "TODOS",
        }).length,
      ).toBe(0);
    });
  });

  describe("slicePagina / totalPaginas / kitMapFromList", () => {
    it("paginação respeita PAGE_SIZE", () => {
      const items = Array.from({ length: PAGE_SIZE + 3 }, (_, i) => i);
      expect(slicePagina(items, 0).length).toBe(PAGE_SIZE);
      expect(slicePagina(items, 1).length).toBe(3);
    });

    it("totalPaginas mínimo 1 com lista vazia", () => {
      expect(totalPaginas(0)).toBe(1);
    });

    it("kitMapFromList", () => {
      const m = kitMapFromList([
        { id: 1, nome: "A" },
        { id: 2, nome: "B" },
      ]);
      expect(m.get(2)).toBe("B");
    });
  });

  describe("computeStatusCounts", () => {
    it("conta todos os status", () => {
      const list = [
        aparelhoFixture({
          id: 1,
          tipo: "SIM",
          status: "EM_ESTOQUE",
          proprietario: "INFINITY",
        }),
        aparelhoFixture({
          id: 2,
          tipo: "SIM",
          status: "EM_ESTOQUE",
          proprietario: "INFINITY",
        }),
      ];
      const c = computeStatusCounts(list);
      expect(c.EM_ESTOQUE).toBe(2);
      expect(c.INSTALADO).toBe(0);
    });
  });
});
