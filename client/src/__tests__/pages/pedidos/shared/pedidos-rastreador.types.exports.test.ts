import { describe, expect, it } from "vitest";
import {
  mapPedidoToView,
  STATUS_CONFIG,
  STATUS_ORDER,
  STATUS_TO_API,
  URGENCIA_LABELS,
  URGENCIA_STYLE,
} from "@/pages/pedidos/shared/pedidos-rastreador.types";
import type { PedidoRastreadorApi } from "@/pages/pedidos/shared/pedidos-rastreador.types";
import { mapPedidoToView as mapPedidoToViewDirect } from "@/pages/pedidos/shared/map-pedido-rastreador-to-view";
import {
  STATUS_CONFIG as STATUS_CONFIG_KANBAN,
  STATUS_ORDER as STATUS_ORDER_KANBAN,
  STATUS_TO_API as STATUS_TO_API_KANBAN,
  URGENCIA_LABELS as URGENCIA_LABELS_KANBAN,
  URGENCIA_STYLE as URGENCIA_STYLE_KANBAN,
} from "@/pages/pedidos/shared/pedidos-rastreador-kanban";

function apiMin(over: Partial<PedidoRastreadorApi> = {}): PedidoRastreadorApi {
  return {
    id: 1,
    codigo: "P-1",
    tipoDestino: "TECNICO",
    tecnicoId: 1,
    clienteId: null,
    subclienteId: null,
    quantidade: 1,
    status: "SOLICITADO",
    urgencia: "MEDIA",
    observacao: null,
    criadoPorId: 1,
    criadoEm: "2020-01-01T00:00:00.000Z",
    atualizadoEm: "2020-01-01T00:00:00.000Z",
    entregueEm: null,
    tecnico: { id: 1, nome: "Tech" },
    ...over,
  };
}

describe("pages/pedidos/shared/pedidos-rastreador.types (reexports)", () => {
  it("reexporta os mesmos objetos/função que pedidos-rastreador-kanban e map-pedido (referência)", () => {
    expect(mapPedidoToView).toBe(mapPedidoToViewDirect);
    expect(URGENCIA_LABELS).toBe(URGENCIA_LABELS_KANBAN);
    expect(STATUS_CONFIG).toBe(STATUS_CONFIG_KANBAN);
    expect(STATUS_ORDER).toBe(STATUS_ORDER_KANBAN);
    expect(STATUS_TO_API).toBe(STATUS_TO_API_KANBAN);
    expect(URGENCIA_STYLE).toBe(URGENCIA_STYLE_KANBAN);
  });

  describe("invariantes STATUS_ORDER / STATUS_CONFIG / STATUS_TO_API", () => {
    it("STATUS_ORDER cobre exatamente as chaves de STATUS_CONFIG e STATUS_TO_API, sem duplicar", () => {
      const orderSet = new Set(STATUS_ORDER);
      expect(orderSet.size).toBe(STATUS_ORDER.length);

      const configKeys = Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[];
      const apiKeys = Object.keys(STATUS_TO_API) as (keyof typeof STATUS_TO_API)[];

      expect(new Set(configKeys)).toEqual(orderSet);
      expect(new Set(apiKeys)).toEqual(orderSet);
    });

    it("cada chave do kanban tem label e mapeamento API coerente com o fluxo do pedido", () => {
      const fluxoEsperado: Array<[keyof typeof STATUS_TO_API, string]> = [
        ["solicitado", "SOLICITADO"],
        ["em_configuracao", "EM_CONFIGURACAO"],
        ["configurado", "CONFIGURADO"],
        ["despachado", "DESPACHADO"],
        ["entregue", "ENTREGUE"],
      ];

      for (const [key, api] of fluxoEsperado) {
        expect(STATUS_TO_API[key]).toBe(api);
        expect(STATUS_CONFIG[key].label.length).toBeGreaterThan(0);
        expect(STATUS_CONFIG[key].color.length).toBeGreaterThan(0);
        expect(STATUS_CONFIG[key].dotColor).toContain("bg-");
      }
    });
  });

  describe("URGENCIA_LABELS e URGENCIA_STYLE", () => {
    it("cada urgência da API tem label e estilo de UI alinhados (chave API → label → estilo)", () => {
      const apiKeys = ["BAIXA", "MEDIA", "ALTA", "URGENTE"] as const;
      for (const k of apiKeys) {
        const label = URGENCIA_LABELS[k];
        expect(label, `label para ${k}`).toBeTruthy();
        const style = URGENCIA_STYLE[label];
        expect(style, `estilo para label "${label}"`).toBeDefined();
        expect(style.bar).toContain("border-l-");
        expect(style.badge).toBeTruthy();
        expect(style.valueText).toBeTruthy();
      }
    });

    it("labels de urgência são distintas (evita colisão de chave em URGENCIA_STYLE)", () => {
      const labels = Object.values(URGENCIA_LABELS);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  describe("mapPedidoToView (via barrel)", () => {
    it("TÉCNICO sem objeto tecnico usa fallback de destinatário", () => {
      const v = mapPedidoToView(
        apiMin({ tecnico: null, tecnicoId: null }),
      );
      expect(v.destinatario).toBe("Técnico");
    });

    it("MISTO sem itens não inventa itensMisto", () => {
      const v = mapPedidoToView(
        apiMin({
          tipoDestino: "MISTO",
          itens: undefined,
        }),
      );
      expect(v.tipo).toBe("misto");
      expect(v.itensMisto).toBeUndefined();
    });

    it("dataSolicitacao ausente usa criadoEm na view", () => {
      const v = mapPedidoToView(
        apiMin({
          dataSolicitacao: undefined,
          criadoEm: "2024-06-15T12:00:00.000Z",
        }),
      );
      expect(v.dataSolicitacao).toBe("2024-06-15T12:00:00.000Z");
    });

    it("mapeia cada status de API para a chave do kanban", () => {
      const casos: Array<[PedidoRastreadorApi["status"], string]> = [
        ["SOLICITADO", "solicitado"],
        ["EM_CONFIGURACAO", "em_configuracao"],
        ["CONFIGURADO", "configurado"],
        ["DESPACHADO", "despachado"],
        ["ENTREGUE", "entregue"],
      ];
      for (const [status, key] of casos) {
        const v = mapPedidoToView(apiMin({ status }));
        expect(v.status).toBe(key);
      }
    });

    it("CLIENTE: só cliente (sem subcliente) usa nome do cliente", () => {
      const v = mapPedidoToView(
        apiMin({
          tipoDestino: "CLIENTE",
          tecnicoId: null,
          tecnico: null,
          cliente: { id: 9, nome: "ACME" },
          subcliente: null,
        }),
      );
      expect(v.destinatario).toBe("ACME");
    });
  });
});
