import { describe, expect, it } from "vitest";
import {
  buildHistoricoMovimentacaoDescricao,
  mapDebitoApiToView,
} from "@/pages/debitos-equipamentos/domain/mapDebitoApiToView";
import { buildDebitoRastreadorListaApi } from "./debitos-equipamentos.fixtures";

describe("buildHistoricoMovimentacaoDescricao", () => {
  it("prioriza pedido sobre lote quando ambos existem", () => {
    const s = buildHistoricoMovimentacaoDescricao({
      id: 1,
      delta: 1,
      criadoEm: "2024-01-01",
      pedido: { id: 1, codigo: "P-1" },
      lote: { id: 2, referencia: "L-A" },
    });
    expect(s).toContain("Pedido P-1");
    expect(s).not.toContain("Lote");
  });

  it("usa lote quando não há pedido", () => {
    expect(
      buildHistoricoMovimentacaoDescricao({
        id: 1,
        delta: -1,
        criadoEm: "2024-01-01",
        lote: { id: 2, referencia: "REF-99" },
      }),
    ).toBe("Lote REF-99");
  });

  it("aparelho sem identificador usa ID", () => {
    expect(
      buildHistoricoMovimentacaoDescricao({
        id: 1,
        delta: 1,
        criadoEm: "2024-01-01",
        aparelho: { id: 42, identificador: null },
      }),
    ).toBe("Individual — ID 42");
  });

  it("concatena OS quando ordemServico presente", () => {
    expect(
      buildHistoricoMovimentacaoDescricao({
        id: 1,
        delta: 1,
        criadoEm: "2024-01-01",
        pedido: { id: 1, codigo: "X" },
        ordemServico: { id: 9, numero: 1001 },
      }),
    ).toBe("Pedido X · OS nº 1001");
  });

  it("registro manual sem referências", () => {
    expect(
      buildHistoricoMovimentacaoDescricao({
        id: 1,
        delta: 1,
        criadoEm: "2024-01-01",
      }),
    ).toBe("Registro manual");
  });
});

describe("mapDebitoApiToView", () => {
  it("mapeia devedor/credor Infinity e status aberto quando quantidade > 0", () => {
    const v = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({
        devedorTipo: "INFINITY",
        devedorClienteId: null,
        devedorCliente: null,
        credorTipo: "CLIENTE",
        credorClienteId: 3,
        credorCliente: { id: 3, nome: "Zé" },
        quantidade: 2,
      }),
    );
    expect(v.devedor).toEqual({ nome: "Infinity", tipo: "infinity" });
    expect(v.credor).toEqual({ nome: "Zé", tipo: "cliente" });
    expect(v.status).toBe("aberto");
    expect(v.modelos).toEqual([{ nome: "MarcaX Modelo Y", quantidade: 2 }]);
  });

  it("cliente sem nome usa fallback Cliente", () => {
    const v = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({
        devedorTipo: "CLIENTE",
        devedorClienteId: 1,
        devedorCliente: null,
      }),
    );
    expect(v.devedor.nome).toBe("Cliente");
  });

  it("quantidade <= 0 → quitado", () => {
    const v = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({ quantidade: 0 }),
    );
    expect(v.status).toBe("quitado");
  });

  it("delta zero conta como saída e quantidade 0 no histórico", () => {
    const v = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({
        historicos: [
          {
            id: 1,
            delta: 0,
            criadoEm: "2024-02-01T10:00:00.000Z",
          },
        ],
      }),
    );
    expect(v.historico[0].tipo).toBe("saida");
    expect(v.historico[0].quantidade).toBe(0);
  });

  it("delta negativo → saída com quantidade absoluta", () => {
    const v = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({
        historicos: [
          { id: 1, delta: -3, criadoEm: "2024-02-01T10:00:00.000Z" },
        ],
      }),
    );
    expect(v.historico[0].tipo).toBe("saida");
    expect(v.historico[0].quantidade).toBe(3);
  });

  it("delta positivo → entrada", () => {
    const v = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({
        historicos: [{ id: 1, delta: 4, criadoEm: "2024-02-01T10:00:00.000Z" }],
      }),
    );
    expect(v.historico[0].tipo).toBe("entrada");
    expect(v.historico[0].quantidade).toBe(4);
  });

  it("historicos ausente vira array vazio", () => {
    const v = mapDebitoApiToView(
      buildDebitoRastreadorListaApi({ historicos: undefined }),
    );
    expect(v.historico).toEqual([]);
  });
});
