import { describe, expect, it } from "vitest";
import { mapPedidoToView } from "@/pages/pedidos/shared/map-pedido-rastreador-to-view";
import type { PedidoRastreadorApi } from "@/pages/pedidos/shared/pedidos-rastreador.types";

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

describe("mapPedidoToView", () => {
  it("TÉCNICO: destinatario e status em chave de kanban", () => {
    const v = mapPedidoToView(apiMin());
    expect(v.destinatario).toBe("Tech");
    expect(v.status).toBe("solicitado");
  });

  it("MISTO: itensMisto a partir de itens; cliente sem nome usa fallback #id", () => {
    const v = mapPedidoToView(
      apiMin({
        tipoDestino: "MISTO",
        itens: [
          {
            id: 1,
            proprietario: "INFINITY",
            clienteId: null,
            quantidade: 1,
            cliente: null,
          },
          {
            id: 2,
            proprietario: "CLIENTE",
            clienteId: 5,
            quantidade: 2,
            cliente: { id: 5, nome: "Z" },
          },
        ],
      }),
    );
    expect(v.tipo).toBe("misto");
    expect(v.itensMisto).toEqual([
      { label: "Infinity", quantidade: 1 },
      { label: "Z", quantidade: 2 },
    ]);
  });

  it("urgência: chave inexistente em URGENCIA_LABELS cai em Média (edge)", () => {
    const p: PedidoRastreadorApi = { ...apiMin() };
    (p as { urgencia: string }).urgencia = "___INVALID___";
    const v = mapPedidoToView(p);
    expect(v.urgencia).toBe("Média");
  });

  it("CLIENTE: prioriza subcliente > cliente (edge)", () => {
    const v = mapPedidoToView(
      apiMin({
        tipoDestino: "CLIENTE",
        tecnicoId: null,
        tecnico: null,
        cliente: { id: 1, nome: "C" },
        subcliente: { id: 2, nome: "Sub" },
      }),
    );
    expect(v.tipo).toBe("cliente");
    expect(v.destinatario).toBe("Sub");
  });
});
