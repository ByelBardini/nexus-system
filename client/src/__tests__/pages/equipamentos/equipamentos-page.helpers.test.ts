import { describe, expect, it } from "vitest";
import type { EquipamentoListItem } from "@/pages/equipamentos/lista/equipamentos-page.shared";
import {
  computeMarcasFromEquipamentos,
  computeOperadorasFromEquipamentos,
  computePipelineCounts,
  filterEquipamentosList,
  formatMarcaModeloEquipamento,
  getEquipamentoStatusPresentation,
  listOnlyEquipamentosMontados,
  loteEquipamentoResumo,
  proprietarioLabelEquipamento,
  resolveKitNomeEquipamento,
  simLinhaDetalheOperadora,
  sliceEquipamentosPage,
  totalPaginasEquipamentosList,
} from "@/pages/equipamentos/lista/equipamentos-page.helpers";

function item(
  overrides: Partial<EquipamentoListItem> &
    Pick<EquipamentoListItem, "id" | "tipo" | "status">,
): EquipamentoListItem {
  return {
    proprietario: "INFINITY",
    criadoEm: "",
    atualizadoEm: "",
    ...overrides,
  } as EquipamentoListItem;
}

describe("equipamentos-page.helpers", () => {
  describe("listOnlyEquipamentosMontados", () => {
    it("mantém apenas RASTREADOR com SIM vinculado", () => {
      const list = [
        item({
          id: 1,
          tipo: "RASTREADOR",
          status: "CONFIGURADO",
          simVinculado: { id: 1, identificador: "890" },
        }),
        item({
          id: 2,
          tipo: "RASTREADOR",
          status: "CONFIGURADO",
          simVinculado: undefined,
        }),
        item({
          id: 3,
          tipo: "SIM",
          status: "CONFIGURADO",
          simVinculado: { id: 2, identificador: "891" },
        }),
      ];
      const r = listOnlyEquipamentosMontados(list);
      expect(r.map((x) => x.id)).toEqual([1]);
    });

    it("edge: lista vazia retorna vazio", () => {
      expect(listOnlyEquipamentosMontados([])).toEqual([]);
    });
  });

  describe("computeMarcasFromEquipamentos / computeOperadorasFromEquipamentos", () => {
    it("ordena e deduplica", () => {
      const list = [
        item({
          id: 1,
          tipo: "RASTREADOR",
          status: "CONFIGURADO",
          marca: "B",
          simVinculado: {
            id: 1,
            identificador: "x",
            operadora: "Vivo",
          },
        }),
        item({
          id: 2,
          tipo: "RASTREADOR",
          status: "CONFIGURADO",
          marca: "A",
          simVinculado: {
            id: 2,
            identificador: "y",
            operadora: "Claro",
          },
        }),
        item({
          id: 3,
          tipo: "RASTREADOR",
          status: "CONFIGURADO",
          marca: "A",
          simVinculado: { id: 3, identificador: "z", operadora: "Vivo" },
        }),
      ];
      expect(computeMarcasFromEquipamentos(list)).toEqual(["A", "B"]);
      expect(computeOperadorasFromEquipamentos(list)).toEqual([
        "Claro",
        "Vivo",
      ]);
    });
  });

  describe("computePipelineCounts", () => {
    it("conta estágios de acordo com equipamentoMatchesStageFilter", () => {
      const list = [
        item({
          id: 1,
          tipo: "RASTREADOR",
          status: "CONFIGURADO",
          kitId: null,
          simVinculado: { id: 1, identificador: "1" },
        }),
        item({
          id: 2,
          tipo: "RASTREADOR",
          status: "CONFIGURADO",
          kitId: 9,
          simVinculado: { id: 2, identificador: "2" },
        }),
        item({
          id: 3,
          tipo: "RASTREADOR",
          status: "DESPACHADO",
          simVinculado: { id: 3, identificador: "3" },
        }),
      ];
      const c = computePipelineCounts(list);
      expect(c.total).toBe(3);
      expect(c.configurados).toBe(1);
      expect(c.emKit).toBe(1);
      expect(c.despachados).toBe(1);
      expect(c.comTecnico).toBe(0);
      expect(c.instalados).toBe(0);
    });
  });

  describe("filterEquipamentosList", () => {
    const base = [
      item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        kitId: null,
        identificador: "IMEI-ALPHA",
        marca: "M1",
        proprietario: "INFINITY",
        simVinculado: {
          id: 10,
          identificador: "ICCID-999",
          operadora: "Vivo",
        },
        tecnico: { id: 1, nome: "João Silva" },
        lote: { id: 1, referencia: "L-A" },
      }),
      item({
        id: 2,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        kitId: 5,
        identificador: "IMEI-BETA",
        marca: "M2",
        proprietario: "CLIENTE",
        cliente: { id: 1, nome: "Cliente X" },
        simVinculado: {
          id: 11,
          identificador: "ICCID-888",
          operadora: "Claro",
        },
      }),
      item({
        id: 3,
        tipo: "RASTREADOR",
        status: "INSTALADO",
        proprietario: "CLIENTE",
        cliente: { id: 2, nome: "Cliente Y" },
        identificador: "IMEI-GAMMA",
        simVinculado: {
          id: 12,
          identificador: "ICCID-777",
          operadora: "Claro",
        },
      }),
    ];

    it("busca por IMEI (case insensitive)", () => {
      const r = filterEquipamentosList(base, {
        busca: "alpha",
        pipelineFilter: "TODOS",
        statusFilter: "TODOS",
        proprietarioFilter: "TODOS",
        marcaFilter: "TODOS",
        operadoraFilter: "TODOS",
      });
      expect(r.map((x) => x.id)).toEqual([1]);
    });

    it("busca por trecho numérico do kitId (string)", () => {
      const r = filterEquipamentosList(base, {
        busca: "5",
        pipelineFilter: "TODOS",
        statusFilter: "TODOS",
        proprietarioFilter: "TODOS",
        marcaFilter: "TODOS",
        operadoraFilter: "TODOS",
      });
      expect(r.map((x) => x.id)).toEqual([2]);
    });

    it("pipeline e status sincronizados filtram EM_KIT", () => {
      const r = filterEquipamentosList(base, {
        busca: "",
        pipelineFilter: "EM_KIT",
        statusFilter: "EM_KIT",
        proprietarioFilter: "TODOS",
        marcaFilter: "TODOS",
        operadoraFilter: "TODOS",
      });
      expect(r.map((x) => x.id)).toEqual([2]);
    });

    it("edge: pipeline TODOS mas status específico ainda restringe (comportamento legado)", () => {
      const r = filterEquipamentosList(base, {
        busca: "",
        pipelineFilter: "TODOS",
        statusFilter: "INSTALADO",
        proprietarioFilter: "TODOS",
        marcaFilter: "TODOS",
        operadoraFilter: "TODOS",
      });
      expect(r.map((x) => x.id)).toEqual([3]);
    });

    it("filtro operadora e proprietário", () => {
      const r = filterEquipamentosList(base, {
        busca: "",
        pipelineFilter: "TODOS",
        statusFilter: "TODOS",
        proprietarioFilter: "CLIENTE",
        marcaFilter: "TODOS",
        operadoraFilter: "Claro",
      });
      expect(r.map((x) => x.id).sort((a, b) => a - b)).toEqual([2, 3]);
    });
  });

  describe("resolveKitNomeEquipamento", () => {
    it("prefere kit.nome, senão mapa por kitId", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        kit: { id: 1, nome: "Do objeto" },
        kitId: 1,
        simVinculado: { id: 1, identificador: "x" },
      });
      const m = new Map([[1, "Do mapa"]]);
      expect(resolveKitNomeEquipamento(e, m)).toBe("Do objeto");
      const e2 = { ...e, kit: undefined };
      expect(resolveKitNomeEquipamento(e2, m)).toBe("Do mapa");
    });

    it("edge: sem kit retorna null", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        simVinculado: { id: 1, identificador: "x" },
      });
      expect(resolveKitNomeEquipamento(e, new Map())).toBeNull();
    });
  });

  describe("formatMarcaModeloEquipamento / proprietarioLabelEquipamento", () => {
    it("formata marca e modelo; proprietário Infinity sem cliente", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        marca: "Tel",
        modelo: "X1",
        proprietario: "INFINITY",
        simVinculado: { id: 1, identificador: "x" },
      });
      expect(formatMarcaModeloEquipamento(e)).toBe("Tel X1");
      expect(proprietarioLabelEquipamento(e)).toBe("Infinity");
    });

    it("edge: sem marca retorna hífen", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        marca: null,
        simVinculado: { id: 1, identificador: "x" },
      });
      expect(formatMarcaModeloEquipamento(e)).toBe("-");
    });
  });

  describe("simLinhaDetalheOperadora / loteEquipamentoResumo", () => {
    it("monta linha com operadora, marca e MB", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        simVinculado: {
          id: 1,
          identificador: "x",
          operadora: "Vivo",
          marcaSimcard: { id: 1, nome: "Giga" },
          planoSimcard: { id: 1, planoMb: 128 },
        },
      });
      expect(simLinhaDetalheOperadora(e)).toBe("Vivo · Giga · 128 MB");
    });

    it("edge: sem dados retorna hífen", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        simVinculado: { id: 1, identificador: "x" },
      });
      expect(simLinhaDetalheOperadora(e)).toBe("-");
    });

    it("lote junta referências equipamento e sim", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        lote: { id: 1, referencia: "L1" },
        simVinculado: {
          id: 1,
          identificador: "x",
          lote: { id: 2, referencia: "L2" },
        },
      });
      expect(loteEquipamentoResumo(e)).toBe("L1 · L2");
    });
  });

  describe("getEquipamentoStatusPresentation", () => {
    it("CONFIGURADO com kitId usa apresentação Em Kit", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        kitId: 1,
        simVinculado: { id: 1, identificador: "x" },
      });
      const p = getEquipamentoStatusPresentation(e);
      expect(p.kind).toBe("em_kit");
      expect(p.label).toBe("Em Kit");
      expect(p.dotClass).toContain("blue");
    });

    it("CONFIGURADO sem kitId usa status padrão", () => {
      const e = item({
        id: 1,
        tipo: "RASTREADOR",
        status: "CONFIGURADO",
        kitId: null,
        simVinculado: { id: 1, identificador: "x" },
      });
      const p = getEquipamentoStatusPresentation(e);
      expect(p.kind).toBe("standard");
      expect(p.label).toBe("Configurado");
    });
  });

  describe("sliceEquipamentosPage / totalPaginasEquipamentosList", () => {
    it("paginação e total de páginas com PAGE_SIZE do domínio", () => {
      const items = Array.from({ length: 25 }, (_, i) => i);
      expect(sliceEquipamentosPage(items, 0).length).toBe(12);
      expect(sliceEquipamentosPage(items, 1).length).toBe(12);
      expect(sliceEquipamentosPage(items, 2).length).toBe(1);
      expect(totalPaginasEquipamentosList(25)).toBe(3);
      expect(totalPaginasEquipamentosList(0)).toBe(1);
    });
  });
});
