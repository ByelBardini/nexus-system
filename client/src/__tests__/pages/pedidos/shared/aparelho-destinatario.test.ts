import { describe, expect, it } from "vitest";
import type { AparelhoNoKit } from "@/pages/pedidos/shared/pedidos-config-types";
import {
  collectDestinatariosEmpresasAparelhos,
  getDestinatarioExibicaoAparelhoNoKit,
  getDestinatarioFiltroAparelhoNoKit,
} from "@/pages/pedidos/shared/aparelho-destinatario";

function base(over: Partial<AparelhoNoKit> = {}): AparelhoNoKit {
  return {
    id: 1,
    identificador: "1",
    marca: "M",
    modelo: "Mo",
    operadora: null,
    status: "ok",
    proprietario: "INFINITY",
    ...over,
  };
}

describe("aparelho-destinatario", () => {
  it("exibição: prioriza cliente sobre técnico quando ambos existem", () => {
    expect(
      getDestinatarioExibicaoAparelhoNoKit(
        base({
          cliente: { id: 1, nome: "ClienteFirst" },
          tecnico: { id: 2, nome: "TecnicoSecond" },
        }),
      ),
    ).toBe("ClienteFirst");
  });

  it("exibição: prioriza cliente, depois técnico, depois Infinity, senão '-'", () => {
    expect(getDestinatarioExibicaoAparelhoNoKit(base({ cliente: { id: 1, nome: "C" } }))).toBe("C");
    expect(
      getDestinatarioExibicaoAparelhoNoKit(
        base({ cliente: null, tecnico: { id: 1, nome: "T" } as AparelhoNoKit["tecnico"] }),
      ),
    ).toBe("T");
    expect(
      getDestinatarioExibicaoAparelhoNoKit(
        base({ proprietario: "INFINITY" }),
      ),
    ).toBe("Infinity");
    expect(
      getDestinatarioExibicaoAparelhoNoKit(
        base({ proprietario: "CLIENTE", cliente: null, tecnico: null }),
      ),
    ).toBe("-");
  });

  it("filtro: string vazia quando nenhum rótulo (diferente de exibição)", () => {
    expect(
      getDestinatarioFiltroAparelhoNoKit(
        base({ proprietario: "CLIENTE", cliente: null, tecnico: null }),
      ),
    ).toBe("");
  });

  it("collectDestinatariosEmpresasAparelhos: ignora nulos, dedup e sort", () => {
    const a1 = base({ id: 1, cliente: { id: 1, nome: "B" } });
    const a2 = base({ id: 2, cliente: { id: 2, nome: "A" } });
    const a3 = base({
      id: 3,
      proprietario: "CLIENTE",
      cliente: null,
      tecnico: null,
    });
    expect(
      collectDestinatariosEmpresasAparelhos([a1, a2, a3]),
    ).toEqual(["A", "B"]);
  });

  it("edge: aparelhos undefined vira array vazio", () => {
    expect(collectDestinatariosEmpresasAparelhos(undefined)).toEqual([]);
  });
});
