import { describe, expect, it } from "vitest";
import { buildAparelhoNoKit } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";
import { buildPedidoView } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";
import {
  aggregateResumoAparelhosDoKit,
  buildAvançarStatusPayload,
  buildRetrocederStatusPayload,
  getSidePanelDerivations,
} from "@/pages/pedidos/side-panel/side-panel.utils";
import type { KitVinculado } from "@/pages/pedidos/shared/pedidos-config-types";
import type { PedidoRastreadorApi, PedidoRastreadorView } from "@/pages/pedidos/shared/pedidos-rastreador.types";

function kitV(id: number, q: number): KitVinculado {
  return { id, nome: `K${id}`, quantidade: q };
}

describe("aggregateResumoAparelhosDoKit", () => {
  it("agrega marcas/modelos, operadoras (com fallback sim) e empresas", () => {
    const r = aggregateResumoAparelhosDoKit([
      buildAparelhoNoKit({
        marca: "A",
        modelo: "1",
        operadora: "Vivo",
        cliente: { id: 1, nome: "C1" },
      }),
      buildAparelhoNoKit({
        marca: "A",
        modelo: "1",
        operadora: null,
        simVinculado: { identificador: "x", operadora: "Claro" },
        tecnico: { id: 2, nome: "T1" },
      }),
    ]);
    expect(r.marcasModelos).toEqual(["A / 1"]);
    expect(r.operadoras).toEqual(["Claro", "Vivo"]);
    expect(r.empresas).toEqual(["C1", "T1"]);
  });

  it("inclui Infinity quando proprietario INFINITY e sem nomes", () => {
    const r = aggregateResumoAparelhosDoKit([
      buildAparelhoNoKit({
        proprietario: "INFINITY",
        marca: "X",
        modelo: "Y",
        operadora: "Oi",
        cliente: null,
        tecnico: null,
      }),
    ]);
    expect(r.empresas).toEqual(["Infinity"]);
  });

  it("lista vazia e null/undefined: retorna três listas vazias", () => {
    expect(aggregateResumoAparelhosDoKit(null)).toEqual({
      marcasModelos: [],
      operadoras: [],
      empresas: [],
    });
    expect(aggregateResumoAparelhosDoKit([])).toEqual({
      marcasModelos: [],
      operadoras: [],
      empresas: [],
    });
  });

  it("deduplica e ordena lexicamente", () => {
    const r = aggregateResumoAparelhosDoKit([
      buildAparelhoNoKit({ marca: "B", modelo: "2", operadora: "B" }),
      buildAparelhoNoKit({ marca: "A", modelo: "1", operadora: "A" }),
    ]);
    expect(r.marcasModelos).toEqual(["A / 1", "B / 2"]);
  });
});

describe("getSidePanelDerivations", () => {
  const k = [kitV(1, 3), kitV(2, 2)];

  it("pedido em_configuracao: progresso 5/5 permite próximo passo configurado", () => {
    const pedido = buildPedidoView({ status: "em_configuracao", quantidade: 5 });
    const d = getSidePanelDerivations(pedido, k, "TRANSPORTADORA", true);
    expect(d.estaConcluido).toBe(false);
    expect(d.proximoStatus).toBe("configurado");
    expect(d.podeAvançar).toBe(true);
    expect(d.bloqueiaAvançoParaConfigurado).toBe(false);
  });

  it("bloqueia avanço para configurado quando faltam rastreadores", () => {
    const pedido = buildPedidoView({ status: "em_configuracao", quantidade: 10 });
    const d = getSidePanelDerivations(pedido, k, "TRANSPORTADORA", true);
    expect(d.proximoStatus).toBe("configurado");
    expect(d.bloqueiaAvançoParaConfigurado).toBe(true);
    expect(d.podeAvançar).toBe(false);
  });

  it("em configurado com EM_MAOS pula para entregue", () => {
    const pedido = buildPedidoView({ status: "configurado", quantidade: 5 });
    const d = getSidePanelDerivations(pedido, k, "EM_MAOS", true);
    expect(d.proximoStatus).toBe("entregue");
    expect(d.mostraConcluir).toBe(true);
  });

  it("despachado: só pode ir para entregue", () => {
    const pedido = buildPedidoView({ status: "despachado", quantidade: 5 });
    const d = getSidePanelDerivations(pedido, k, "TRANSPORTADORA", true);
    expect(d.proximoStatus).toBe("entregue");
  });

  it("entregue: concluído, sem ações de status", () => {
    const pedido = buildPedidoView({ status: "entregue", quantidade: 5 });
    const d = getSidePanelDerivations(pedido, k, "TRANSPORTADORA", true);
    expect(d.estaConcluido).toBe(true);
    expect(d.proximoStatus).toBeNull();
    expect(d.podeAvançar).toBe(false);
  });

  it("podeEditar false: sem próximo status", () => {
    const pedido = buildPedidoView({ status: "em_configuracao" });
    const d = getSidePanelDerivations(pedido, k, "TRANSPORTADORA", false);
    expect(d.proximoStatus).toBeNull();
  });

  it("status desconhecido: derivação segura (sem avanço)", () => {
    const pedido = {
      ...buildPedidoView(),
      status: "invalid" as unknown as PedidoRastreadorView["status"],
    };
    const d = getSidePanelDerivations(pedido, k, "TRANSPORTADORA", true);
    expect(d.statusIdx).toBe(-1);
    expect(d.podeAvançar).toBe(false);
    expect(d.proximoStatus).toBeNull();
  });
});

describe("buildAvançarStatusPayload", () => {
  it("inclui kitIds quando transição requer e há kits vinculados", () => {
    const pedido = buildPedidoView();
    const p = buildAvançarStatusPayload(pedido, "configurado", [kitV(9, 1)]);
    expect(p).toEqual({
      id: pedido.id,
      status: "CONFIGURADO",
      kitIds: [9],
    });
  });

  it("omite kitIds quando não precisa (ex. primeiros passos de workflow)", () => {
    const pedido = buildPedidoView();
    const p = buildAvançarStatusPayload(pedido, "solicitado", [kitV(1, 1)]);
    expect(p.kitIds).toBeUndefined();
  });
});

describe("buildRetrocederStatusPayload", () => {
  it("a partir de entregue inclui kitIds dos vinculados", () => {
    const pedido = buildPedidoView({ status: "entregue" });
    const p = buildRetrocederStatusPayload(
      pedido,
      "despachado",
      [kitV(3, 1)],
      null,
    );
    expect(p.kitIds).toEqual([3]);
  });

  it("a partir de entregue sem kits locais usa pedidoApi.kitIds", () => {
    const pedido = buildPedidoView({ status: "entregue" });
    const api: Pick<PedidoRastreadorApi, "kitIds"> = { kitIds: [7, 8] };
    const p = buildRetrocederStatusPayload(
      pedido,
      "despachado",
      [],
      api as PedidoRastreadorApi,
    );
    expect(p.kitIds).toEqual([7, 8]);
  });

  it("não adiciona kitIds ao retroceder de em_configuracao", () => {
    const pedido = buildPedidoView({ status: "em_configuracao" });
    const p = buildRetrocederStatusPayload(
      pedido,
      "solicitado",
      [kitV(1, 1)],
      null,
    );
    expect(p.kitIds).toBeUndefined();
  });
});
